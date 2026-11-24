const HttpError = require('../utils/httpError');

module.exports = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source] ?? {}, { abortEarly: true, stripUnknown: true });
  if (error) return next(new HttpError(400, error.details[0].message));
  req[source] = value;
  return next();
};
