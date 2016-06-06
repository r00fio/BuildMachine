#ifndef _ZINGAYATYPES_H
#define _ZINGAYATYPES_H

typedef enum NCProtocol
{
	RTMP=1, RTMPE=2, RTMPT=3, RTMPTE=4, RTMFP=5
} NCProtocol;

#ifdef __cplusplus
extern "C" {
#endif

    const char * NCProtocolName(NCProtocol p);


#ifdef __cplusplus
}
#endif

typedef enum  StreamDirection
{
	Outgoing, Incoming
} StreamDirection;


typedef enum VideoPixelFormat
{
	NV12,
	NV21,
} VideoPixelFormat;


typedef enum ImageRotation
{
	ROTATE_0,
	ROTATE_90_CLOCKWISE,
	ROTATE_180,
	ROTATE_90_COUNTER_CLOCKWISE,
} ImageRotation;


#endif
