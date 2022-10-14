const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");

const port = 3000;
const imagesPath = path.join(__dirname, '..', 'images');

const broadcastImages = (socket = null) => {
  const images = [];
  fs.readdir(imagesPath, (err, files) => {
    if (err) {
      console.log(err);
    } else {
      images.length = 0;
      files.forEach(file => {
        images.push({
          filename: `/image/${file}`,
          created: fs.statSync(`${imagesPath}/${file}`).ctime
        });
      });
    }
    if (socket) {
      console.log('Sending images to new client');
      socket.emit('images', images);
    } else {
      console.log('Broadcasting images');
      io.sockets.emit('images', images);
    }
  });
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get('/image/:filename', (req, res) => {
  res.sendFile(path.join(imagesPath, req.params.filename));
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  broadcastImages(socket);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

fs.watch(imagesPath, (eventType, filename) => {
  console.log('Image changes detected');
  broadcastImages();
});