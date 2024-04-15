const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'File_Uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }
}).array('attachment', 1);

app.post('/send-email', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).json({ success: false, message: 'Error Uploading File' });
    } else if (err) {
      console.error('Error:', err);
      return res.status(500).json({ success: false, message: 'Error' });
    }

    const { to, subject, text, html } = req.body;

    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ success: false, message: 'Missing Required Fields' });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
      html,
      attachments: []
    };

    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        mailOptions.attachments.push({
          filename: file.originalname,
          path: file.path
        });
      });
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Email Not Sent:', error);
        return res.status(500).json({ success: false, message: 'Not Sending Email' });
      } else {
        console.log('Email sent:', info.response);
        return res.status(200).json({ success: true, message: 'Email sent successfully' });
      }
    });
  });
});

app.use('/File_Uploads', express.static(path.join(__dirname, 'File_Uploads')));

app.listen(PORT, () => {
  console.log(`Server is Running on PORT ${PORT}`);
});
