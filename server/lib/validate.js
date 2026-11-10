const STATUS_VALUES = new Set(['homeoffice', 'ausserhalb']);

function isValidStatus(value) {
  return value === null || STATUS_VALUES.has(value);
}

// Validates a PUT /api/week/:memberId/:date body. Returns an error message
// string, or null if the body is valid.
function validateEntryBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Ungültiger Request-Body';
  }
  if (body.mode === 'full') {
    if (!STATUS_VALUES.has(body.value)) {
      return 'value muss "homeoffice" oder "ausserhalb" sein';
    }
    return null;
  }
  if (body.mode === 'half') {
    if (!isValidStatus(body.am) || !isValidStatus(body.pm)) {
      return 'am/pm müssen "homeoffice", "ausserhalb" oder null sein';
    }
    return null;
  }
  return 'mode muss "full" oder "half" sein';
}

module.exports = { validateEntryBody, STATUS_VALUES };
