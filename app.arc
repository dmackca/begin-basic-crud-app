@app
begin-app

@http
get  /todos
post /todos
post /todos/delete
get  /foo

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
