let Validator = require('validatorjs');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');

const getChatMessages = (req, res, next) => {
  let validator = new Validator({
    userId: req.query.userId,
    otherUserId: req.query.otherUserId
  }, {
    userId: 'required|integer',
    otherUserId: 'required|integer'
  });

  if (validator.passes()) {
    next();
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({
      'errors': validator.errors.errors
    });
  }
};

const sendChatMessage = (req, res, next) => {
  let validator = new Validator({
    title: req.body.title,
    body: req.body.body,
    sender_id: req.body.sender,
    receiver_id: req.body.receiver,
    name: req.body.name
  }, {
    title: 'required|string',
    body: 'required|string',
    sender_id: 'required|integer',
    receiver_id: 'required|integer',
    name: 'required|string'
  });

  if (validator.passes()) {
    next();
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({
      'errors': validator.errors.errors
    });
  }
};

const updateFirebaseToken = (req, res, next) => {
  let validator = new Validator({
    userId: req.body.userId,
    token: req.body.token
  }, {
    userId: 'required|integer',
    token: 'required|string'
  });

  if (validator.passes()) {
    next();
  } else {
    res.status(StatusCodes.BAD_REQUEST).send({
      'errors': validator.errors.errors
    });
  }
};

module.exports = {
  getChatMessages,
  sendChatMessage,
  updateFirebaseToken
};
