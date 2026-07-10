//+------------------------------------------------------------------+
//|                                          ProfytronCopyBridge.mq5 |
//| Polls Profytron /v1/bridge/orders and mirrors master copy trades |
//| onto this terminal — no MetaApi seat required.                   |
//+------------------------------------------------------------------+
#property copyright "Profytron"
#property version   "1.00"
#property strict

input string InpApiBaseUrl = "https://api.profytron.com"; // no trailing slash
input string InpBridgeToken = ""; // paste token from Profytron connect screen
input int    InpPollSeconds = 3;

string JsonGetString(string json, string key)
  {
   string needle = "\"" + key + "\":\"";
   int p = StringFind(json, needle);
   if(p < 0) return "";
   int start = p + StringLen(needle);
   int end = StringFind(json, "\"", start);
   if(end < 0) return "";
   return StringSubstr(json, start, end - start);
  }

double JsonGetNumber(string json, string key)
  {
   string needle = "\"" + key + "\":";
   int p = StringFind(json, needle);
   if(p < 0) return 0;
   int start = p + StringLen(needle);
   while(start < StringLen(json) && (StringGetCharacter(json, start) == ' ' || StringGetCharacter(json, start) == '"'))
      start++;
   string num = "";
   for(int i = start; i < StringLen(json); i++)
     {
      ushort c = StringGetCharacter(json, i);
      if((c >= '0' && c <= '9') || c == '.' || c == '-')
         num += CharToString((uchar)c);
      else
         break;
     }
   return StringToDouble(num);
  }

bool HttpGet(string url, string &outBody)
  {
   char data[];
   char result[];
   string headers = "X-Bridge-Token: " + InpBridgeToken + "\r\n";
   string resultHeaders;
   int code = WebRequest("GET", url, headers, 8000, data, result, resultHeaders);
   outBody = CharArrayToString(result);
   return code == 200;
  }

bool HttpPost(string url, string body, string &outBody)
  {
   char data[];
   char result[];
   StringToCharArray(body, data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(data, ArraySize(data) - 1);
   string headers =
      "X-Bridge-Token: " + InpBridgeToken + "\r\n"
      "Content-Type: application/json\r\n";
   string resultHeaders;
   int code = WebRequest("POST", url, headers, 8000, data, result, resultHeaders);
   outBody = CharArrayToString(result);
   return code == 200 || code == 201;
  }

void Report(string orderId, string status, ulong ticket, string err)
  {
   string url = InpApiBaseUrl + "/bridge/orders/" + orderId + "/result";
   string body = "{\"status\":\"" + status + "\"";
   if(ticket > 0)
      body += ",\"brokerTicket\":\"" + IntegerToString((long)ticket) + "\"";
   if(StringLen(err) > 0)
      body += ",\"errorReason\":\"" + err + "\"";
   body += "}";
   string resp;
   HttpPost(url, body, resp);
  }

void ProcessOrder(string chunk)
  {
   string id = JsonGetString(chunk, "id");
   string action = JsonGetString(chunk, "action");
   string symbol = JsonGetString(chunk, "symbol");
   string side = JsonGetString(chunk, "side");
   double volume = JsonGetNumber(chunk, "volume");
   double sl = JsonGetNumber(chunk, "stopLoss");
   double tp = JsonGetNumber(chunk, "takeProfit");
   string existingTicket = JsonGetString(chunk, "brokerTicket");

   if(StringLen(id) == 0 || StringLen(action) == 0)
      return;

   MqlTradeRequest req;
   MqlTradeResult  res;
   ZeroMemory(req);
   ZeroMemory(res);

   if(action == "OPEN")
     {
      req.action = TRADE_ACTION_DEAL;
      req.symbol = symbol;
      req.volume = volume > 0 ? volume : 0.01;
      req.type = (side == "SELL") ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
      req.price = (req.type == ORDER_TYPE_BUY)
                    ? SymbolInfoDouble(symbol, SYMBOL_ASK)
                    : SymbolInfoDouble(symbol, SYMBOL_BID);
      req.sl = sl;
      req.tp = tp;
      req.deviation = 30;
      req.magic = 77001;
      req.comment = "Profytron bridge";
      if(!OrderSend(req, res) || res.retcode != TRADE_RETCODE_DONE)
        {
         Report(id, "FAILED", 0, IntegerToString((int)res.retcode));
         return;
        }
      Report(id, "FILLED", res.order > 0 ? res.order : res.deal, "");
      return;
     }

   if(action == "CLOSE")
     {
      ulong ticket = (ulong)StringToInteger(existingTicket);
      if(ticket == 0)
        {
         Report(id, "FAILED", 0, "missing_ticket");
         return;
        }
      if(!PositionSelectByTicket(ticket))
        {
         Report(id, "FILLED", ticket, "");
         return;
        }
      req.action = TRADE_ACTION_DEAL;
      req.position = ticket;
      req.symbol = PositionGetString(POSITION_SYMBOL);
      req.volume = PositionGetDouble(POSITION_VOLUME);
      long ptype = PositionGetInteger(POSITION_TYPE);
      req.type = (ptype == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
      req.price = (req.type == ORDER_TYPE_BUY)
                    ? SymbolInfoDouble(req.symbol, SYMBOL_ASK)
                    : SymbolInfoDouble(req.symbol, SYMBOL_BID);
      req.deviation = 30;
      req.magic = 77001;
      req.comment = "Profytron close";
      if(!OrderSend(req, res) || res.retcode != TRADE_RETCODE_DONE)
        {
         Report(id, "FAILED", ticket, IntegerToString((int)res.retcode));
         return;
        }
      Report(id, "FILLED", ticket, "");
     }
  }

void OnTimer()
  {
   if(StringLen(InpBridgeToken) < 16)
      return;
   string body;
   string url = InpApiBaseUrl + "/bridge/orders?limit=5";
   if(!HttpGet(url, body))
      return;

   // Naive split on order objects — sufficient for small payloads.
   int pos = 0;
   while(true)
     {
      int start = StringFind(body, "{\"id\":", pos);
      if(start < 0)
         break;
      int end = StringFind(body, "}", start);
      if(end < 0)
         break;
      string chunk = StringSubstr(body, start, end - start + 1);
      ProcessOrder(chunk);
      pos = end + 1;
     }
  }

int OnInit()
  {
   EventSetTimer(MathMax(2, InpPollSeconds));
   Print("ProfytronCopyBridge started");
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason)
  {
   EventKillTimer();
  }
