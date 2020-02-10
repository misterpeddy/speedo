# Speedo

Speedo is a Chrome extension that intelligently tunes your YouTube video playback speed.

## Problem

Most content that I consume on YouTube falls into one of two categories:

1. Videos that I watch to learn something (lectures, educational videos, news segments, tutorials)
2. Videos that I watch to experience something (music, comedy, dance videos, artistic performances)

In the first case, the act of watching the video is a means to an end, while in the second case, it is the end itself. So, I tend to watch videos in the first camp at 2x speed, and the second at normal speed.

It is somewhat annoying to have to set and re-set the playback speed, when for example it is fairly easy to guess that I want to watch Justin Bieber's new banger at normal speed. Speedo solves this problem by observing what videos the user watches at what speed and automatically setting the playback speed for new videos, by classifying them into one of the above two groups.

## Roadmap

* Simple chrome extension that captures video features and playback speed of YouTube videos
* Chrome extension phones home to a Cloud function endpoint that writes features + playback speed to a BigQuery table
* Extension phones home at page load time to request playback speed, which is not populated for new videos
* Simple TFX pipeline with ExampleGen reading from bigquery, pass-through TF Transform and Estimator-based Trainer
* TFX Pipeline running nightly on Kubeflow with ExampleGen, TF Transform, Keras model, deploying model to a TF Serving cluster
* Cloud function endpoint that reads talks to TF Serving cluster to classify new videos
