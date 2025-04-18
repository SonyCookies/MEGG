import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.utils import load_img, img_to_array
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.layers import GlobalAveragePooling2D, Flatten, Dense, Dropout
from tensorflow.keras.callbacks import ModelCheckpoint, ReduceLROnPlateau
import numpy as np
import splitfolders
import os

# Paths
dataset = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/dataset"
dataset_dir = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/splitted-dataset"
saved_model = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/model_weights/egg_resnet50.keras"
real_testpath = "D:/4THYEAR/CAPSTONE/MEGG/ai-training-backend/real_test"

# Split dataset (80% Train, 10% Validation, 10% Test)
splitfolders.ratio(dataset, output=dataset_dir, seed=1337, ratio=(.8, .1, .1), move=False)
trainpath = os.path.join(dataset_dir, "train")
validpath = os.path.join(dataset_dir, "val")
testpath = os.path.join(dataset_dir, "test")

# Image Parameters
img_width, img_height = (224, 224)
batch_size = 20

# Data Generators
data_gen = ImageDataGenerator(preprocessing_function=tf.keras.applications.resnet50.preprocess_input)

train_set = data_gen.flow_from_directory(trainpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical')
valid_set = data_gen.flow_from_directory(validpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical', shuffle=False)
test_set = data_gen.flow_from_directory(testpath, target_size=(img_width, img_height), batch_size=batch_size, class_mode='categorical', shuffle=False)

# Load or Train Model
if os.path.exists(saved_model):
    print("Loading existing model...")
    model = load_model(saved_model)
else:
    print("Creating new model...")
    base_model = ResNet50(input_shape=(img_width, img_height, 3), include_top=False, weights='imagenet')
    
    # Freeze first layers to keep pre-trained features
    for layer in base_model.layers[:-100]:
        layer.trainable = False

    # Custom Layers
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Flatten()(x)
    x = Dense(1024, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(train_set.num_classes, activation='softmax')(x)

    model = Model(base_model.input, x)
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.000001), loss='categorical_crossentropy', metrics=['accuracy'])

# Training Callbacks
checkpoint = ModelCheckpoint(saved_model, monitor='val_loss', verbose=1, save_best_only=True, mode='auto')
reduce_lr = ReduceLROnPlateau(monitor='val_loss', verbose=1, factor=0.1, patience=2, mode='auto')

# Train Model
epochs = 30
model.fit(train_set, steps_per_epoch=train_set.samples // train_set.batch_size, 
          epochs=epochs, validation_data=valid_set, validation_steps=valid_set.samples // valid_set.batch_size,
          callbacks=[checkpoint, reduce_lr])

# Save Model Properly as .keras
os.makedirs(os.path.dirname(saved_model), exist_ok=True)

model.save(saved_model)
print(f"Model saved successfully as {saved_model}")
