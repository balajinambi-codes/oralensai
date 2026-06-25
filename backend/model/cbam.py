"""Convolutional Block Attention Module (CBAM) for TensorFlow/Keras."""

from __future__ import annotations

import tensorflow as tf
from tensorflow.keras.layers import (
    Activation,
    Add,
    Concatenate,
    Conv2D,
    Dense,
    Layer,
    Multiply,
    Reshape,
)


class ChannelAttention(Layer):
    """Channel attention: recalibrates feature maps along the channel axis."""

    def __init__(self, ratio: int = 16, **kwargs):
        super().__init__(**kwargs)
        self.ratio = ratio

    def build(self, input_shape: tf.TensorShape) -> None:
        channels = int(input_shape[-1])
        self.shared_dense_one = Dense(
            max(channels // self.ratio, 1),
            activation="relu",
            use_bias=True,
            name=f"{self.name}_shared_dense_one",
        )
        self.shared_dense_two = Dense(
            channels,
            use_bias=True,
            name=f"{self.name}_shared_dense_two",
        )
        super().build(input_shape)

    def call(self, inputs: tf.Tensor) -> tf.Tensor:
        avg_pool = tf.reduce_mean(inputs, axis=[1, 2])
        max_pool = tf.reduce_max(inputs, axis=[1, 2])

        avg_out = self.shared_dense_two(self.shared_dense_one(avg_pool))
        max_out = self.shared_dense_two(self.shared_dense_one(max_pool))

        attention = Activation("sigmoid")(Add()([avg_out, max_out]))
        attention = Reshape((1, 1, int(inputs.shape[-1])))(attention)
        return Multiply()([inputs, attention])

    def get_config(self) -> dict:
        config = super().get_config()
        config.update({"ratio": self.ratio})
        return config


class SpatialAttention(Layer):
    """Spatial attention: recalibrates feature maps along spatial dimensions."""

    def __init__(self, kernel_size: int = 7, **kwargs):
        super().__init__(**kwargs)
        self.kernel_size = kernel_size

    def build(self, input_shape: tf.TensorShape) -> None:
        self.conv = Conv2D(
            filters=1,
            kernel_size=self.kernel_size,
            padding="same",
            activation="sigmoid",
            use_bias=False,
            name=f"{self.name}_conv",
        )
        super().build(input_shape)

    def call(self, inputs: tf.Tensor) -> tf.Tensor:
        avg_pool = tf.reduce_mean(inputs, axis=-1, keepdims=True)
        max_pool = tf.reduce_max(inputs, axis=-1, keepdims=True)
        pooled = Concatenate(axis=-1)([avg_pool, max_pool])
        attention = self.conv(pooled)
        return Multiply()([inputs, attention])

    def get_config(self) -> dict:
        config = super().get_config()
        config.update({"kernel_size": self.kernel_size})
        return config


class CBAMBlock(Layer):
    """Sequential application of channel then spatial attention."""

    def __init__(self, ratio: int = 16, kernel_size: int = 7, **kwargs):
        super().__init__(**kwargs)
        self.ratio = ratio
        self.kernel_size = kernel_size
        self.channel_attention = ChannelAttention(ratio=ratio, name=f"{self.name}_channel")
        self.spatial_attention = SpatialAttention(
            kernel_size=kernel_size,
            name=f"{self.name}_spatial",
        )

    def call(self, inputs: tf.Tensor) -> tf.Tensor:
        x = self.channel_attention(inputs)
        return self.spatial_attention(x)

    def get_config(self) -> dict:
        config = super().get_config()
        config.update({"ratio": self.ratio, "kernel_size": self.kernel_size})
        return config
