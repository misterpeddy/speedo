from typing import List, Text
import tensorflow as tf
import tensorflow_hub as hub
import tensorflow_transform as tft
from tfx.components.trainer.executor import TrainerFnArgs
from bert_model import build_and_compile_bert_classifier
from bert_tokenizer import BertPreprocessor

_BERT_LINK = 'https://tfhub.dev/tensorflow/bert_en_cased_L-12_H-768_A-12/2'

_TRAIN_BATCH_SIZE = 16
_EVAL_BATCH_SIZE = 16
_TEXT_FEATURE_KEY = 'channel'
_LABEL_KEY = 'playback_rate'
_MAX_LEN = 256
_EPOCHS = 1

def preprocessing_fn(inputs):
  """tf.transform's callback function for preprocessing inputs."""
  input_word_ids, input_mask, segment_ids = _tokenize(inputs[_TEXT_FEATURE_KEY])
  labels = inputs[_LABEL_KEY] - 1

  return {
    _LABEL_KEY: labels,
    'input_word_ids': input_word_ids,
    'input_mask': input_mask,
    'segment_ids': segment_ids
  }

def run_fn(fn_args: TrainerFnArgs):
  """Train the model based on given args."""

  tf_transform_output = tft.TFTransformOutput(fn_args.transform_output)
  train_dataset = _input_fn(fn_args.train_files, tf_transform_output, batch_size=_TRAIN_BATCH_SIZE)
  eval_dataset = _input_fn(fn_args.eval_files, tf_transform_output, batch_size=_EVAL_BATCH_SIZE)

  mirrored_strategy = tf.distribute.MirroredStrategy()
  with mirrored_strategy.scope():
    bert_layer = hub.KerasLayer(_BERT_LINK, trainable=True)
    model = build_and_compile_bert_classifier(bert_layer, _MAX_LEN, 2)

  model.fit(
      train_dataset,
      epochs=_EPOCHS,
      steps_per_epoch=fn_args.train_steps,
      validation_data=eval_dataset,
      validation_steps=fn_args.eval_steps)

  serving_fn = _get_serve_tf_examples_fn(model, tf_transform_output).get_concrete_function(
      tf.TensorSpec(shape=[None], dtype=tf.string, name='examples'))

  signatures = {
      'serving_default': serving_fn
  }

  model.save(fn_args.serving_model_dir, save_format='tf', signatures=signatures)

def _gzip_reader_fn(filenames):
  """Small utility returning a record reader that can read gzip'ed files."""
  return tf.data.TFRecordDataset(filenames, compression_type='GZIP')

def _tokenize(sequence):
  """Tokenize the sentence and insert appropriate tokens."""
  processor = BertPreprocessor(_BERT_LINK)
  return processor.tokenize_single_sentence_pad(
      tf.reshape(sequence, [-1]), max_len=_MAX_LEN)

def _input_fn(file_pattern: List[Text], tf_transform_output: tft.TFTransformOutput,
    batch_size: int = 200) -> tf.data.Dataset:
  """Generates features and label for tuning/training."""
  transformed_feature_spec = (
      tf_transform_output.transformed_feature_spec().copy())
  dataset = tf.data.experimental.make_batched_features_dataset(
      file_pattern=file_pattern,
      batch_size=batch_size,
      features=transformed_feature_spec,
      reader=_gzip_reader_fn,
      label_key=_LABEL_KEY)

  return dataset.prefetch(tf.data.experimental.AUTOTUNE)

def _get_serve_tf_examples_fn(model, tf_transform_output):
  """Returns inference function: serialized tf.Example -> infernece results."""

  model.tft_layer = tf_transform_output.transform_features_layer()

  @tf.function
  def serve_tf_examples_fn(serialized_tf_examples):
    feature_spec = tf_transform_output.raw_feature_spec()
    feature_spec.pop(_LABEL_KEY)
    parsed_features = tf.io.parse_example(serialized_tf_examples, feature_spec)

    transformed_features = model.tft_layer(parsed_features)
    return model(transformed_features)

  return serve_tf_examples_fn
