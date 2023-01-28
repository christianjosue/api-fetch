# regular-expressions
API REST with Nodejs and Express using WebSockets to response client's requests, and JWT for authentication.   
Client has a token which expires in a time no longer than 10 minutes and that allows him to send only 5 requests.    
Every request consists on writing a simple mathematical operation and see if it matches or not with the recursive regular expression defined on the server side.    
The response is handled by WebSocketServer.  
  
New implementations:
- Proxy middleware
- Https Server
- Geolocation
