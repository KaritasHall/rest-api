const cors = require("cors");
const express = require("express");
const expressApp = express();
const firebaseAdmin = require("firebase-admin");
const bodyParser = require("body-parser");
const serviceAccount = require("./firebase-admin-keys.json");
const { getFirestore } = require("firebase-admin/firestore");

// middlewares
expressApp.use(cors({ methods: ["GET", "POST", "PUT", "DELETE"] }));
expressApp.use(bodyParser.json());

// firebase app initialization
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

// database reference
const db = getFirestore();

// Get task from database
expressApp.get("/", async (req, res) => {
  const snapshot = await db.collection("todo").get();

  const todoList = snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  res.send(todoList);
});

// Create new task
expressApp.post("/todos", async (req, res) => {
  // save to firebase, reference is saved as ... reference!
  const reference = await db.collection("todo").add({
    name: req.body.task,
    completed: false,
  });

  // we use the reference to get a snapshot!
  const snapshot = await reference.get();

  // send the firebase snapshot back to the client!
  res.send({
    id: snapshot.id,
    ...snapshot.data(),
  });
});

// Update task (edit)
expressApp.put("/todos/:id", async (req, res) => {
  await db.collection("todo").doc(req.params.id).update({
    name: req.body.name,
    completed: req.body.completed,
  });

  res.send({
    id: req.params.id,
    name: req.body.name,
    completed: req.body.completed,
  });
});

// Delete task from to-do list
expressApp.delete("/todos/:id", async (req, res) => {
  const reference = await db.collection("todo").doc(req.params.id).delete();
  if (reference.writeTime) {
    res.send("Task deleted!");
  } else {
    res.status(500).send("Failed to delete");
  }
});

expressApp.listen(5000, async () => {
  console.log("server has started on port 5000");
});
