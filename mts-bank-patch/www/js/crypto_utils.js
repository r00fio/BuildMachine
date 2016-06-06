;
var CryptoUtils =
{
    inherit: function(proto)
        {
           function F(){};
           F.prototype = proto;
           return new F;
        },
    HEXDIGITS: "0123456789ABCDEF",
    PKCS7:
        {
          wrapDetachedSignature: function(certid,sign)
            {
   
              sign = CryptoUtils.BYTEBUFF.create().
                         addInt(0x42535043).                                            // marker
                         merge(CryptoUtils.BYTEBUFF.filetime(new Date().getTime())).    // timestamp
                         addInt(0x0000801e).                                            // algorithm id
                         addInt(1).                                                     // flags
                         addInt(36+certid.nBytes()+sign.nBytes()).                      // total size
                         addInt(certid.nBytes()).                                       // certificate serial number size
                         addInt(sign.nBytes()).                                         // signature size
                         merge(certid).                                                 // certificate serial number
                         merge(sign);                                                   // signature
              sign  = CryptoUtils.BYTEBUFF.create().addInt(sign.crc()).merge(sign).toBase64String();
              return sign + CryptoUtils.BYTEBUFF.create().addInt(sign.length).toBase64String();
            },
          unwrapDetachedSignature: function(sign)
            { 
              var result = new Array();
              var size = sign.length-8;
              if((size > 0) && (CryptoUtils.BYTEBUFF.create().decodeFromBase64(sign.substr(size)).intValueAt(0) == size))
              {
                 var buff = CryptoUtils.BYTEBUFF.create().decodeFromBase64(sign.substring(0,size));
                 if((buff.nBytes() > 36) && (buff.intValueAt(0) == buff.tail(4).crc()) && (buff.intValueAt(4) == 0x42535043) && (buff.intValueAt(20) & 1))
                 {
                   result[0] = buff.cut(36,buff.intValueAt(28));
                   result[1] = buff.cut(36+buff.intValueAt(28),buff.intValueAt(32));
                }
              }
              return result;
            }
        },
    num2hex: function(v)
        {
            var b = CryptoUtils.HEXDIGITS.charAt((v>>4)&15)+CryptoUtils.HEXDIGITS.charAt(v&15);
            v >>>= 8;
            b += CryptoUtils.HEXDIGITS.charAt((v>>4)&15)+CryptoUtils.HEXDIGITS.charAt(v&15);
            v >>>= 8;
            b += CryptoUtils.HEXDIGITS.charAt((v>>4)&15)+CryptoUtils.HEXDIGITS.charAt(v&15);
            v >>>= 8;
            b += CryptoUtils.HEXDIGITS.charAt((v>>4)&15)+CryptoUtils.HEXDIGITS.charAt(v&15);
             return b;
        },
    buf2hex: function(b)
        {
            for(var i=0,l=b.length,s='';i<l;)
            {
                s += CryptoUtils.num2hex(b[i++]);
            }
            return s;
        },
    str2hex: function(s)
        {
            for(var i=0,n=s.length,v,b='';i<n;)
            {
                v = s.charCodeAt(i++);
                b += CryptoUtils.HEXDIGITS.charAt((v>>4)&15)+CryptoUtils.HEXDIGITS.charAt(v&15)+CryptoUtils.HEXDIGITS.charAt((v>>12)&15)+CryptoUtils.HEXDIGITS.charAt((v>>8)&15);
            }
            return b;
        },
    BYTEBUFF:
        {
            B64TAB: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
            B64ABC: [
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
                    64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64,  64
                ],
            CRC32TAB: [
                     0x00000000,0x77073096,0xee0e612c,0x990951ba,0x076dc419,0x706af48f,
                     0xe963a535,0x9e6495a3,0x0edb8832,0x79dcb8a4,0xe0d5e91e,0x97d2d988,
                     0x09b64c2b,0x7eb17cbd,0xe7b82d07,0x90bf1d91,0x1db71064,0x6ab020f2,
                     0xf3b97148,0x84be41de,0x1adad47d,0x6ddde4eb,0xf4d4b551,0x83d385c7,
                     0x136c9856,0x646ba8c0,0xfd62f97a,0x8a65c9ec,0x14015c4f,0x63066cd9,
                     0xfa0f3d63,0x8d080df5,0x3b6e20c8,0x4c69105e,0xd56041e4,0xa2677172,
                     0x3c03e4d1,0x4b04d447,0xd20d85fd,0xa50ab56b,0x35b5a8fa,0x42b2986c,
                     0xdbbbc9d6,0xacbcf940,0x32d86ce3,0x45df5c75,0xdcd60dcf,0xabd13d59,
                     0x26d930ac,0x51de003a,0xc8d75180,0xbfd06116,0x21b4f4b5,0x56b3c423,
                     0xcfba9599,0xb8bda50f,0x2802b89e,0x5f058808,0xc60cd9b2,0xb10be924,
                     0x2f6f7c87,0x58684c11,0xc1611dab,0xb6662d3d,0x76dc4190,0x01db7106,
                     0x98d220bc,0xefd5102a,0x71b18589,0x06b6b51f,0x9fbfe4a5,0xe8b8d433,
                     0x7807c9a2,0x0f00f934,0x9609a88e,0xe10e9818,0x7f6a0dbb,0x086d3d2d,
                     0x91646c97,0xe6635c01,0x6b6b51f4,0x1c6c6162,0x856530d8,0xf262004e,
                     0x6c0695ed,0x1b01a57b,0x8208f4c1,0xf50fc457,0x65b0d9c6,0x12b7e950,
                     0x8bbeb8ea,0xfcb9887c,0x62dd1ddf,0x15da2d49,0x8cd37cf3,0xfbd44c65,
                     0x4db26158,0x3ab551ce,0xa3bc0074,0xd4bb30e2,0x4adfa541,0x3dd895d7,
                     0xa4d1c46d,0xd3d6f4fb,0x4369e96a,0x346ed9fc,0xad678846,0xda60b8d0,
                     0x44042d73,0x33031de5,0xaa0a4c5f,0xdd0d7cc9,0x5005713c,0x270241aa,
                     0xbe0b1010,0xc90c2086,0x5768b525,0x206f85b3,0xb966d409,0xce61e49f,
                     0x5edef90e,0x29d9c998,0xb0d09822,0xc7d7a8b4,0x59b33d17,0x2eb40d81,
                     0xb7bd5c3b,0xc0ba6cad,0xedb88320,0x9abfb3b6,0x03b6e20c,0x74b1d29a,
                     0xead54739,0x9dd277af,0x04db2615,0x73dc1683,0xe3630b12,0x94643b84,
                     0x0d6d6a3e,0x7a6a5aa8,0xe40ecf0b,0x9309ff9d,0x0a00ae27,0x7d079eb1,
                     0xf00f9344,0x8708a3d2,0x1e01f268,0x6906c2fe,0xf762575d,0x806567cb,
                     0x196c3671,0x6e6b06e7,0xfed41b76,0x89d32be0,0x10da7a5a,0x67dd4acc,
                     0xf9b9df6f,0x8ebeeff9,0x17b7be43,0x60b08ed5,0xd6d6a3e8,0xa1d1937e,
                     0x38d8c2c4,0x4fdff252,0xd1bb67f1,0xa6bc5767,0x3fb506dd,0x48b2364b,
                     0xd80d2bda,0xaf0a1b4c,0x36034af6,0x41047a60,0xdf60efc3,0xa867df55,
                     0x316e8eef,0x4669be79,0xcb61b38c,0xbc66831a,0x256fd2a0,0x5268e236,
                     0xcc0c7795,0xbb0b4703,0x220216b9,0x5505262f,0xc5ba3bbe,0xb2bd0b28,
                     0x2bb45a92,0x5cb36a04,0xc2d7ffa7,0xb5d0cf31,0x2cd99e8b,0x5bdeae1d,
                     0x9b64c2b0,0xec63f226,0x756aa39c,0x026d930a,0x9c0906a9,0xeb0e363f,
                     0x72076785,0x05005713,0x95bf4a82,0xe2b87a14,0x7bb12bae,0x0cb61b38,
                     0x92d28e9b,0xe5d5be0d,0x7cdcefb7,0x0bdbdf21,0x86d3d2d4,0xf1d4e242,
                     0x68ddb3f8,0x1fda836e,0x81be16cd,0xf6b9265b,0x6fb077e1,0x18b74777,
                     0x88085ae6,0xff0f6a70,0x66063bca,0x11010b5c,0x8f659eff,0xf862ae69,
                     0x616bffd3,0x166ccf45,0xa00ae278,0xd70dd2ee,0x4e048354,0x3903b3c2,
                     0xa7672661,0xd06016f7,0x4969474d,0x3e6e77db,0xaed16a4a,0xd9d65adc,
                     0x40df0b66,0x37d83bf0,0xa9bcae53,0xdebb9ec5,0x47b2cf7f,0x30b5ffe9,
                     0xbdbdf21c,0xcabac28a,0x53b39330,0x24b4a3a6,0xbad03605,0xcdd70693,
                     0x54de5729,0x23d967bf,0xb3667a2e,0xc4614ab8,0x5d681b02,0x2a6f2b94,
                     0xb40bbe37,0xc30c8ea1,0x5a05df1b,0x2d02ef8d
                ],
            HEXTAB: [
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
                        "F0","F1","F2","F3","F4","F5","F6","F7","F8","F9","FA","FB","FC","FD","FE","FF"
                ],
            FILETIME_CORRECTION: new Number("0x019DB1DED53E8000"),
            filetime: function(millis)
                {
                  return CryptoUtils.BYTEBUFF.create().decodeFromHex((CryptoUtils.BYTEBUFF.FILETIME_CORRECTION+new Number(millis)*10000).toString(16)).inverse();
                },
            create: function()
                {
                    var _ndx;
                    var _buf;
                    var self =
                    {
                        clear: function()
                            {
                               _ndx = 0;
                               _buf = new Array();
                                return self;
                            },
                        nBytes: function()
                            {
                                return _ndx;
                            },
                        length: function()
                            {
                                return _buf.length;
                            },
                        toString: function()
                            {
                                var b = new Array();
                                for(var i=_buf.length;i-->0;)
                                {
                                    b[i] = self.charCodeAt(i);
                                }
                                return b.join('');
                            },
                        toHexString: function()
                            {
                                var b = new Array();
                                for(var i=_ndx;i-->0;)
                                {
                                    b[i] = CryptoUtils.BYTEBUFF.HEXTAB[self.byteCodeAt(i)];
                                }
                                return b.join('');
                            },
                        toArray: function()
                            {
                                var b = new Array();
                                for(var i=0;i<_ndx;)
                                {
                                  b.push(self.byteCodeAt(i++));
                                }
                                return b;
                            },
                        toBase64String: function()
                            {
                                var b = new Array();
                                b.length = ((_ndx+2)/3)<<2;
                                for(var i=0,j=0,n=0,a=0;;++i)
                                {
                                    if(i < _ndx)
                                    {
                                        a=(a<<8)|self.byteCodeAt(i);
                                        j+=8;
                                        do
                                        {
                                            b[n++]=CryptoUtils.BYTEBUFF.B64TAB.charAt((a>>>(j-=6))&63);
                                        } while(j > 5);
                                        continue;
                                    }
                                    if(j)
                                    {
                                        b[n++]=CryptoUtils.BYTEBUFF.B64TAB.charAt((a<<(6-j))&63);
                                    }
                                    while(n & 3)
                                    {
                                        b[n++]='=';
                                    }
                                    return b.join('');
                                }
                            },
                        byteCodeAt: function(i)
                            {
                                return (_buf[i>>1]>>(8*(i&1)))&255;
                            },
                        cut: function(pos,length)
                            {
                                if((pos > 0) || ((pos+length)<_ndx))
                                {
                                  var result = CryptoUtils.BYTEBUFF.create();
                                  for(;(pos<_ndx)&&(length>0);--length)
                                  {
                                    result.addByte(self.byteCodeAt(pos++));
                                  }
                                  return result;
                                }
                                return self;
                            },
                        head: function(length)
                            {
                              return self.cut(0,length);
                            },
                        tail: function(pos)
                            {
                              return self.cut(pos,_ndx-pos);
                            },
                        intValueAt: function(i)
                            {
                                var val = 0;
                                for(var j=0;(j<32)&&(i<_ndx);j+=8)
                                {
                                    val |= self.byteCodeAt(i++)<<j;
                                }
                                return val;
                            },
                        charCodeAt: function(i)
                            {
                                return String.fromCharCode(_buf[i]);
                            },
                        addArray: function(value)
                            {
                                if(value !== null) for(var i=0;i<value.length;)
                                {
                                    self.addByte(value[i++]);
                                }
                                return self;
                            },
                        addByte: function(value)
                            {
                                value &= 255;
                                if(_ndx & 1)
                                {
                                    _buf[_ndx>>1] |= value<<8;
                                }
                                else
                                {
                                    _buf[_ndx>>1]  = value;
                                }
                                ++_ndx;
                                return self;
                            },
                        addWord: function(value)
                            {
                                self.addByte(value);
                                self.addByte(value>>8);
                                return self;
                            },
                        addInt: function(value)
                            {
                                self.addByte(value);
                                self.addByte(value>>8);
                                self.addByte(value>>16);
                                self.addByte(value>>24);
                                return self;
                            },
                        addString: function(value)
                            {
                                if(value !== null) for(var i=0;i<value.length;)
                                {
                                    self.addWord(value.charCodeAt(i++));
                                }
                                return self;
                            },
                        inverse: function()
                            {
                                if(_ndx > 1)
                                {
                                  var result = CryptoUtils.BYTEBUFF.create();
                                  for(var i=_ndx;i--;)
                                  {
                                    result.addByte(self.byteCodeAt(i));
                                  }
                                  return result;
                                }
                                return self;
                            },
                        decodeFromHex: function(value)
                            {
                                if(value !== null)
                                {
                                  if(value.length & 1)
                                  {
                                    value = '0'+value;
                                  }
                                  for(var i=0;i<value.length;i+=2)
                                  {
                                    self.addByte(parseInt(value.substring(i,i+2),16));
                                  }
                                }
                                return self;
                            },
                        decodeFromBase64: function(value)
                            {
                                if(value !== null)
                                {
                                  var a = 0;
                                  var i = 0;
                                  var j = 0;
                                  var v = 0;
                                  var cb = value.length;
                                  do
                                  {
                                    if(cb > 0)
                                    {
                                      v = CryptoUtils.BYTEBUFF.B64ABC[value.charCodeAt(i++)&255];
                                      switch(v)
                                      {
                                        case 65   :
                                          cb = 0;
                                          break;
                                        case 64   :
                                          continue;
                                        default   :
                                          a =(a<<6)|v;
                                          j+=6;
                                          if(j < 8)
                                          {
                                            continue;
                                          }
                                      }
                                    }
                                    while(j>7)
                                    {
                                      self.addByte((a>>>(j-=8))&255);
                                    }
                                  } while(cb-- > 0);
                                }
                                return self;
                            },
                        pack: function(value)
                            {
                                if(value !== null)
                                {
                                    value = value.toString();
                                    for(var i=0;i<value.length;)
                                     {
                                        self.addByte(value.charCodeAt(i++));
                                    }
                                }
                                return self;
                            },
                        unpack: function()
                            {
                                var b = new Array();
                                for(var i=0;i<_ndx;)
                                {
                                  b[i] = String.fromCharCode(self.byteCodeAt(i++));
                                }
                                return b.join('');
                            },
                        encodeToBase64: function(value)
                            {
                                self.addString(CryptoUtils.BYTEBUFF.create().addString(value.toString()).toBase64String());
                                return self;
                            },
                        encodeToBase64AndPack: function(value)
                            {
                                self.pack(CryptoUtils.BYTEBUFF.create().addString(value.toString()).toBase64String());
                                return self;
                            },
                        crc:   function()
                            {
                              var v = 0xffffffff;
                              for(var i=0;i<_ndx;)
                              {
                                v = CryptoUtils.BYTEBUFF.CRC32TAB[(v^self.byteCodeAt(i++))&255]^(v>>>8);
                              }
                              return ~v;
                            },
                        merge: function(buff)
                            {
                                if(buff !== null)
                                {
                                    if(buff.nBytes && buff.byteCodeAt) for(var i=0;i<buff.nBytes();)
                                    {
                                       self.addByte(buff.byteCodeAt(i++));
                                    }
                                    else
                                    {
                                       return self.addString(buff.toString());
                                    }
                                  }
                                  return self;
                              }
                    };
                    self.clear();
                    return self;
                }
        },
    HASH:
    {
        GOST:
        {
            SB:
                        {
                CNA: new Array(
                        new Array(0x8,0x7,0x3,0xC,0xE,0xD,0x2,0x0,0xB,0xA,0x4,0x1,0x5,0xF,0x9,0x6),
                        new Array(0xC,0x8,0x9,0xD,0x3,0x4,0x1,0x5,0x7,0x6,0x2,0xF,0xA,0x0,0xB,0xE),
                        new Array(0xA,0x5,0xC,0x8,0xD,0x2,0x1,0x9,0xB,0x7,0xE,0xF,0x0,0x3,0x6,0x4),
                        new Array(0xA,0xC,0xB,0x0,0x6,0x2,0xE,0x8,0xF,0x5,0x7,0xD,0x3,0x9,0x4,0x1),
                        new Array(0x5,0x3,0xF,0xE,0xA,0x0,0xB,0x8,0x7,0x1,0xD,0x9,0x2,0x4,0xC,0x6),
                        new Array(0x3,0x9,0x4,0x0,0xE,0x7,0x8,0xF,0x5,0xD,0x6,0xA,0xB,0x2,0x1,0xC),
                        new Array(0x9,0x4,0x0,0xF,0x7,0xD,0xA,0xB,0x2,0x3,0x5,0x6,0xE,0x1,0xC,0x8),
                        new Array(0x3,0x6,0xA,0xE,0x2,0xB,0x1,0x9,0xD,0xC,0x8,0xF,0x4,0x5,0x0,0x7)
                    ),
                CP: new Array(0xFF00FF00, 0xFF00FF00, 0x00FF00FF, 0x00FF00FF, 0x00FFFF00, 0xFF0000FF, 0x000000FF, 0xFF00FFFF),
                calc: function(s)
                {
                    return CryptoUtils.HASH.GOST.calc(CryptoUtils.str2hex(s),CryptoUtils.HASH.GOST.SB.CNA,CryptoUtils.HASH.GOST.SB.CP);
                }
            },
            loop32encode: function(B,X,CNA)
                {
                    for(var i=0,j,n,v;;)
                    {
                        n = B[0]+X[(i<24)?(i&7):(31-i)];
                                v = 0;
                                         for(j=0;j<8;++j,n>>>=4)
                                    {
                                            v |= CNA[j][n&15]<<(j<<2);
                                 }
                                     v = ((v<<11)|(v>>>21))^B[1];
                                 if(++i<32)
                                   {
                                            B[1] = B[0];
                                            B[0] = v;
                                            continue;
                                      }
                                    B[1] = v;
                                     return B;
                                     }
                                },
                        shift64: function(BUFF, count)
                              {
                        var B = new Array(2);
                                    while(count--)
                                    {
                                      B[0] = BUFF[0]^BUFF[2];
                                      B[1] = BUFF[1]^BUFF[3];
                                     BUFF[0] = BUFF[2];
                                      BUFF[1] = BUFF[3];
                                     BUFF[2] = BUFF[4];
                                      BUFF[3] = BUFF[5];
                                     BUFF[4] = BUFF[6];
                                    BUFF[5] = BUFF[7];
                                     BUFF[6] = B[0];
                                    BUFF[7] = B[1];
                                    }
                                    return BUFF;
                               },
            shift16: function(BUFF,count)
                               {
                                    var v;
                                    while(count--)
                                    {
                                        v = BUFF[0]^(BUFF[0]>>>16)^BUFF[1]^(BUFF[1]>>>16)^BUFF[6]^(BUFF[7]>>>16);
                                      BUFF[0] = (BUFF[0]>>>16)|(BUFF[1]<<16);
                                     BUFF[1] = (BUFF[1]>>>16)|(BUFF[2]<<16);
                                       BUFF[2] = (BUFF[2]>>>16)|(BUFF[3]<<16);
                                     BUFF[3] = (BUFF[3]>>>16)|(BUFF[4]<<16);
                                     BUFF[4] = (BUFF[4]>>>16)|(BUFF[5]<<16);
                                      BUFF[5] = (BUFF[5]>>>16)|(BUFF[6]<<16);
                                     BUFF[6] = (BUFF[6]>>>16)|(BUFF[7]<<16);
                                    BUFF[7] = (BUFF[7]>>>16)|(v<<16);
                                    }
                                    return BUFF;
                               },
            sum: function(A1,A2,S)
                               {
                                    for(var i=0;i<8;++i)
                    {
                    S[i] = A1[i] ^ A2[i];
                    }
                                    return S;
                               },
            step: function(BUFF,HASH,CNA,CP)
                               {
                                    var V = new Array(BUFF[0], BUFF[1], BUFF[2], BUFF[3], BUFF[4], BUFF[5], BUFF[6], BUFF[7]);
                                    var U = new Array(HASH[0], HASH[1], HASH[2], HASH[3], HASH[4], HASH[5], HASH[6], HASH[7]);
                                    var X = new Array(8);
                                    var E = new Array(8);
                                    var W = new Array(8);
                                    var B = new Array(2);
                                    for(var i=0,j,l,k;;)
                                    {
                                    CryptoUtils.HASH.GOST.sum(U,V,W);
                                         for(k=0;k<8;++k)
                                    {
                                            X[k] = 0;
                                        for(j=0,l=(k & 3)<<3;j<4;++j)
                                            {
                                                X[k] |= ((W[(j<<1)+(k>>2)]>>>l)&0xff)<<(j<<3);
                                            }
                                        }
                                        B[0] = HASH[i];
                                        B[1] = HASH[i + 1];
                                        CryptoUtils.HASH.GOST.loop32encode(B,X,CNA);
                                        E[i++] = B[0];
                                        E[i++] = B[1];
                                        if(i==8) break;
                                        CryptoUtils.HASH.GOST.shift64(V,2);
                                       CryptoUtils.HASH.GOST.shift64(U,1);
                                        if(i==4)
                                     {
                                            CryptoUtils.HASH.GOST.sum(U,CP,U);
                                        }
                                    }
                                    return CryptoUtils.HASH.GOST.shift16(CryptoUtils.HASH.GOST.sum(CryptoUtils.HASH.GOST.shift16(CryptoUtils.HASH.GOST.sum(CryptoUtils.HASH.GOST.shift16(E,12),BUFF,E),1),HASH,HASH),61);
                                },
            calc: function(data,CNA,CP)
                {
                                    var ACCM = new Array(0, 0, 0, 0, 0, 0, 0, 0);
                                    var HASH = new Array(0, 0, 0, 0, 0, 0, 0, 0);
                                    var SIZE = new Array(0, 0, 0, 0, 0, 0, 0, 0);
                                    for(var i=0,size=data.length>>1,j,v,n,ii,iv,code,b;size>0;)
                                {
                                    n = (size<32)?(size<<3):256;
                                        b = new Array(0, 0, 0, 0, 0, 0, 0, 0);
                                       for(j=0,v= 0; j < 32; ++j)
                                      {
                                            ii = (j&3)<<3;
                                         iv = j>>2;
                                            if(n)
                                            {
                                       n += (SIZE[iv]>>>ii)&0xff;
                                    SIZE[iv] &= ~(0xff << ii);
                                    SIZE[iv] |= (n & 0xff) << ii;
                                      n >>>= 8;
                                    }
                                            if(size)
                                            {
                                                --size;
                                                code = new Number("0x"+data.charAt(i++)+data.charAt(i++));
                                      b[iv] |= code<<ii;
                                       v += code;
                                    }
                                            else if(v == 0)
                                {
                                    continue;
                                           }
                                           v += (ACCM[iv]>>>ii)&0xff;
                                           ACCM[iv] &= ~(0xff<<ii);
                                           ACCM[iv] |= (v&0xff)<<ii;
                                           v >>>= 8;
                                        }
                                       CryptoUtils.HASH.GOST.step(b,HASH,CNA,CP);
                                     }
                                     CryptoUtils.HASH.GOST.step(SIZE,HASH,CNA,CP);
                     return CryptoUtils.buf2hex(CryptoUtils.HASH.GOST.step(ACCM,HASH,CNA,CP));
                }
        }
    }
};
