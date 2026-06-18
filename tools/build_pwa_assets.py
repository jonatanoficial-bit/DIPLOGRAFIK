#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/pwa'
OUT.mkdir(parents=True,exist_ok=True)
BG='#03070b'; GOLD='#d9aa43'; LIGHT='#ead6a3'; BLUE='#0b1d2b'
FONT_BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
FONT_REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def font(path,size):
    try:return ImageFont.truetype(path,size)
    except:return ImageFont.load_default()

def seal(draw,cx,cy,r,maskable=False):
    if maskable:
        draw.rounded_rectangle((cx-r*1.12,cy-r*1.12,cx+r*1.12,cy+r*1.12),radius=int(r*.28),fill=BLUE,outline=GOLD,width=max(2,int(r*.05)))
    draw.ellipse((cx-r,cy-r,cx+r,cy+r),fill=BG,outline=GOLD,width=max(2,int(r*.06)))
    f=font(FONT_BOLD,int(r*1.05))
    box=draw.textbbox((0,0),'D',font=f)
    draw.text((cx-(box[2]-box[0])/2,cy-(box[3]-box[1])/2-box[1]),'D',font=f,fill=LIGHT)

def make_icon(size,name,maskable=False):
    im=Image.new('RGB',(size,size),BG)
    d=ImageDraw.Draw(im)
    if maskable:
        d.rectangle((0,0,size,size),fill=BG)
        r=int(size*.30)
    else:
        d.rounded_rectangle((0,0,size-1,size-1),radius=int(size*.22),fill=BG)
        r=int(size*.36)
    seal(d,size//2,size//2,r,maskable)
    im.save(OUT/name,compress_level=3)

def crop_cover(src,size):
    im=Image.open(src).convert('RGB')
    return ImageOps.fit(im,size,method=Image.Resampling.LANCZOS,centering=(.5,.45))

def overlay_gradient(im):
    w,h=im.size
    layer=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(layer)
    for y in range(h):
        t=y/max(1,h-1)
        alpha=int(105+85*abs(t-.5)*2)
        d.line((0,y,w,y),fill=(3,7,11,alpha))
    return Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB')

def splash(size,name,subtitle='SIMULADOR POLÍTICO E GEOPOLÍTICO'):
    w,h=size
    im=Image.new('RGB',(w,h),BG)
    d=ImageDraw.Draw(im)
    # Lightweight diplomatic-tech background: deterministic and highly compressible.
    for y in range(h):
        t=y/max(1,h-1)
        d.line((0,y,w,y),fill=(3+int(5*t),7+int(10*t),11+int(16*t)))
    step=max(48,int(min(w,h)*.075))
    for x in range(-h,w+h,step):
        d.line((x,0,x-h,h),fill=(16,35,47),width=max(1,int(min(w,h)*.0015)))
    for radius in range(step, max(w,h), step):
        d.arc((w//2-radius,h//3-radius,w//2+radius,h//3+radius),200,340,fill=(50,58,48),width=max(1,int(min(w,h)*.0015)))
    r=int(min(w,h)*.105)
    seal(d,w//2,int(h*.34),r)
    title_font=font(FONT_BOLD,max(28,int(min(w,h)*.055)))
    sub_font=font(FONT_REG,max(14,int(min(w,h)*.019)))
    title='DIPLOCRAFT'
    tb=d.textbbox((0,0),title,font=title_font)
    d.text(((w-(tb[2]-tb[0]))/2,int(h*.49)),title,font=title_font,fill=LIGHT)
    sb=d.textbbox((0,0),subtitle,font=sub_font)
    d.text(((w-(sb[2]-sb[0]))/2,int(h*.565)),subtitle,font=sub_font,fill=GOLD)
    d.rounded_rectangle((int(w*.20),int(h*.63),int(w*.80),int(h*.635)),radius=4,fill=GOLD)
    im.save(OUT/name,compress_level=2)

def screenshot(size,name):
    splash(size,name,'LEAD • NEGOTIATE • DOMINATE')

for size in (64,96,128,192,256,384,512): make_icon(size,f'icon-{size}.png')
make_icon(512,'icon-maskable-512.png',True)
make_icon(180,'apple-touch-icon-180.png')
for size,name in [((750,1334),'splash-750x1334.png'),((1170,2532),'splash-1170x2532.png'),((1290,2796),'splash-1290x2796.png'),((1536,2048),'splash-1536x2048.png'),((2048,1536),'splash-2048x1536.png')]: splash(size,name)
screenshot((720,1280),'screenshot-mobile-720x1280.png')
screenshot((1280,720),'screenshot-desktop-1280x720.png')

items=[]
for path in sorted(OUT.glob('*.png')):
    im=Image.open(path)
    items.append({'path':path.relative_to(ROOT).as_posix(),'width':im.width,'height':im.height,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(ROOT/'meta/pwa-assets.json').parent.mkdir(exist_ok=True)
(ROOT/'meta/pwa-assets.json').write_text(json.dumps({'generated_by':'tools/build_pwa_assets.py','assets':items},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(items)} PWA assets in {OUT.relative_to(ROOT)}')
