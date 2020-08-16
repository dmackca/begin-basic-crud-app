@app
begin-app

@http
get  /foo
get  /s33d
delete  /s33d

@tables
data
  scopeID *String
  dataID **String
  ttl TTL
