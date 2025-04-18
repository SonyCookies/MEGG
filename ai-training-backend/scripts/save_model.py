import tensorflow as tf

# Load the trained model
model = tf.keras.models.load_model("D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/model/Egg_ResNet50.h5")

# Recompile with the same settings to allow resume training
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.000001), 
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

# Save a second copy for training
model.save("D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/model/egg_resnet50_trainable.keras")

print("Trainable model saved successfully as egg_resnet50_trainable.keras")
