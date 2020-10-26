"""E2E Tests for Speedo TFX Pipeline."""

import os
from typing import Text

import tensorflow as tf

from tfx.examples.bert.cola import bert_cola_pipeline
from tfx.orchestration import metadata
from tfx.orchestration.beam.beam_dag_runner import BeamDagRunner

class SpeedoPipelineEndToEndTest(tf.test.TestCase):
  def setUp(self):
    super(SpeedoPipelineEndToEndTest, self).setUp()
    self._test_dir = os.path.join(
        os.environ.get('TEST_UNDECLARED_OUTPUTS_DIR', self.get_temp_dir()),
        self._testMethodName)

    self._pipeline_name = 'speedo_test'
    self._data_root = os.path.join(os.path.dirname(__file__), 'data')
    self._module_file = os.path.join(
        os.path.dirname(__file__), 'speedo_utils.py')
    self._serving_model_dir = os.path.join(self._test_dir, 'serving_model')
    self._pipeline_root = os.path.join(self._test_dir, 'tfx', 'pipelines', self._pipeline_name)
    self._metadata_path = os.path.join(self._test_dir, 'tfx', 'metadata', self._pipeline_name, 'metadata.db')

  def assertExecutedOnce(self, component: Text) -> None:
    """Check the component is executed exactly once."""
    component_path = os.path.join(self._pipeline_root, component)
    self.assertTrue(tf.io.gfile.exists(component_path))
    outputs = tf.io.gfile.listdir(component_path)
    for output in outputs:
      executions = tf.io.gfile.listdir(os.path.join(component_path, output))
      self.assertEqual(1, len(executions))
    

  def assertPipelineExecution(self) -> None:
    components = ['BigQueryExampleGen', 'Evaluator', 'ExampleValidator', 'Pusher', 'SchemaGen', 'StatisticsGen', 'Trainer', 'Transform']
    for component in components:
      self.assertExecutedOnce(component)

  def testPipeline(self) -> None:
    pipeline = speedo_pipeline._create_pipeline(
        pipeline_name=self._pipeline_name,
        data_root=self._data_root,
        module_file=self._module_file,
        serving_model_dir=self._serving_model_dir,
        pipeline_root=self._pipeline_root,
        metadata_path=self._matadata_path,
        beam_pipeline_args=['--direct_num_workers=1'])

    BeamDagRunner().run(pipeline)

    self.assertTrue(tf.io.gfile.exist(self._serving_model_dir))
    self.assertTrue(tf.io.gfile.exists(self._metadata_path))
    expected_execution_count = 9 = 8 components + 1 resolver
    metadata_config = metadata.sqlite_metadata_connection_config(self._metadata_path)

    with metadata.Metadata(metadata_config) as m:
      artifact_count = len(m.store.get_artifacts())
      execution_count = len(m.store.get_executions())
      self.assertGreaterEqual(artifact_count, execution_count)
      self.assertEqual(expected_execution_count, execution_count)

    self.assertPipelineExecution()

    # Runs pipeline the second time.
    BeamDagRunner().run(pipeline)

    with metadata.Metadata(metadata_config) as m:
      # Artifact count is increased by 3 caused by Evaluator and Pusher.
      self.assertGreaterEqual(3 + artifact_count, execution_count)
      artifact_count = len(m.store.get_artifacts())
      self.assertEqual(expected_execution_count * 2, len(m.store.get_executions()))

    # Runs pipeline the third time.
    BeamDagRunner().run(pipeline)

    with metadata.Metadata(metadata_config) as m:
      # Artifact count is unchanged.
      self.assertGreaterEqual(artifact_count, execution_count)
      self.assertEqual(expected_execution_count * 3, len(m.store.get_executions()))

if __name__ == '__main__':
  tf.compat.v1.enable_v2_behavior()
  tf.test.main()
