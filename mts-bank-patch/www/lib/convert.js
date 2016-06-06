/*
 * Some data conversion JavaScript impleventation
 *
 * Version 1.0 Copyright (C) 2007 R-Style Softlab
 *
 * Designed by Alexander V. Ivanov
 */
function StringBufferImpl()
{
	this.buff = new Array();
}
StringBufferImpl.prototype.toString = function()
{
	return this.buff.join('');
};
StringBufferImpl.prototype.append = function(val)
{
	this.buff[this.buff.length] = val;
};
StringBufferImpl.prototype.size = function()
{
	return this.buff.length;
};
 
var B64ABC = new Array(
                    66,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  62,  64,  64,  64,  64,  64,  64,  64,  64,  63,  62,  64,  64,  64,  63,
                    52,  53,  54,  55,  56,  57,  58,  59,  60,  61,  64,  64,  64,  65,  64,  64,
                    64,   0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,  13,  14,
                    15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,  64,  64,  64,  64,  64,
                    64,  26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,  39,  40,
                    41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64);
var B64TAB = new Array(
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/');
/*
 *  Function: fn_b64_decode(data)
 * Parameter: base64 encoded data
 *    Return: decoded data'
 *
 */
function  fn_b64_decode(data)
{
  var a = 0;
  var b = new StringBufferImpl();
  var i = 0;
  var j = 0;
  var n = 0;
  var r = 0;
  var v = 0;
  var cb = data.length;
  do
  {
	if(cb > 0)
    {
    	v = B64ABC[data.charCodeAt(i++)&255];
		switch(v)
        {
        	case 65 :
            	cb = 0;
                break;
			case 64 :
            	continue;
            default	:
            	a =(a<<6)|v;
				j+=6;
				if(j < 24)
				{
					continue;
				}
         }
	}
    for(;j>7;n+=1)
    {
    	if(n&1)
    	{
			b.append(String.fromCharCode((((a>>>(j-=8))&255)<<8)|r));
    	}
    	else
    	{
    		r = (a>>>(j-=8))&255;
    	}
	}
  } while(cb-- > 0);
  if(n&1)
  {
	  b.append(String.fromCharCode(r));
  }
  return b.toString();
}
/*
 *  Function: fn_hex_decode(data)
 * Parameter: hexadecimal characters encoded data
 *    Return: decoded data
 */
function  fn_hex_decode(data)
{
	var b = new StringBufferImpl();
	for(var i = 0, n = data.length; i < n; i += 4)
 	{
    	b.append(String.fromCharCode(new Number("0x"+data.substring(i,i+2))+(new Number("0x"+data.substring(i+2,i+4))<<8)));
  	}
  	return b.toString();
}
/*
 *  Function: fn_txt_decode(data)
 * Parameter: not encoded data
 *    Return: nothing to do, return data back
 */
function  fn_txt_decode(data)
{
  return data;
}
/*
 *  Function: fn_b64_encode(data)
 * Parameter: data
 *    Return: base64 encoded data'
 *
 */
function  fn_b64_encode(data)
{
  for(var i=0,j=0,a=0,b=new StringBufferImpl();;i+=1)
  {
    if(i < data.length)
    {
    	var ch = data.charCodeAt(i);
        for(a=(((a<<8)|(ch&255))<<8)|(ch>>8),j+=16;j>5;)
        {
          b.append(B64TAB[(a>>>(j-=6))&63]);
        }
        continue;
    }
    if(j)
    {
        b.append(B64TAB[(a<<(6-j))&63]);
    }
    while(b.size() & 3)
    {
      b.append('=');
    }
    return b.toString();
  }
}
/*
 *  Function: fn_hex_encode(data)
 * Parameter: data
 *    Return: hexadecimal characters encoded data
 *
 */
var HEXTAB = new Array(
		"00","01","02","03","04","05","06","07","08","09","0A","0B","0C","0D","0E","0F",
		"10","11","12","13","14","15","16","17","18","19","1A","1B","1C","1D","1E","1F",
		"20","21","22","23","24","25","26","27","28","29","2A","2B","2C","2D","2E","2F",
		"30","31","32","33","34","35","36","37","38","39","3A","3B","3C","3D","3E","3F",
		"40","41","42","43","44","45","46","47","48","49","4A","4B","4C","4D","4E","4F",
		"50","51","52","53","54","55","56","57","58","59","5A","5B","5C","5D","5E","5F",
		"60","61","62","63","64","65","66","67","68","69","6A","6B","6C","6D","6E","6F",
		"70","71","72","73","74","75","76","77","78","79","7A","7B","7C","7D","7E","7F",
		"80","81","82","83","84","85","86","87","88","89","8A","8B","8C","8D","8E","8F",
		"90","91","92","93","94","95","96","97","98","99","9A","9B","9C","9D","9E","9F",
		"A0","A1","A2","A3","A4","A5","A6","A7","A8","A9","AA","AB","AC","AD","AE","QF",
		"B0","B1","B2","B3","B4","B5","B6","B7","B8","B9","BA","BB","BC","BD","BE","BF",
		"C0","C1","C2","C3","C4","C5","C6","C7","C8","C9","CA","CB","CC","CD","CE","CF",
		"D0","D1","D2","D3","D4","D5","D6","D7","D8","D9","DA","DB","DC","DD","DE","DF",
		"E0","E1","E2","E3","E4","E5","E6","E7","E8","E9","EA","EB","EC","ED","EE","EF",
		"F0","F1","F2","F3","F4","F5","F6","F7","F8","F9","FA","FB","FC","FD","FE","FF");
function  fn_hex_encode(data)
{
	var b = new StringBufferImpl();
	for(var i=0,n;i < data.length;i+=1)
 	{
		n = data.charCodeAt(i);
 		b.append(HEXTAB[n&255]+HEXTAB[n>>8]);
  	}
	return b.toString();
}
/*
 *  Function: fn_hex_encode(data)
 * Parameter: data
 *    Return: nothing to do, return data back
 *
 */
function  fn_txt_encode(data)
{
  return data;
}
/*
 *  Transport convertion wrappers
 */
function  fn_b64_2_b64(data)
{
  return data;
}
function  fn_b64_2_hex(data)
{
  return fn_hex_encode(fn_b64_decode(data));
}
function  fn_b64_2_txt(data)
{
  return fn_b64_decode(data);
}
function  unwrapBooleanValue(result)
{
	eval("result="+result+";");
	return result;
}
function  unwrapNumericValue(result)
{
	eval("result=parseInt("+result+");");
	return result;
}
function  unwrapStringValue(result)
{
	eval("result='"+result+"';");
	return result;
}
