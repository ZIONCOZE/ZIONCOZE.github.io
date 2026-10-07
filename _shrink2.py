import imageio_ffmpeg, subprocess, os

exe = imageio_ffmpeg.get_ffmpeg_exe()
site = r'D:\灵犀浏览器\users\467461855\projects\11649694727078122\workspace\resume-site'
jobs = [
    ('assets/videos/wanying/wanying-1080p.mp4', '31'),
    ('assets/videos/others/lonely.mp4', '30'),
]
for rel, crf in jobs:
    src = os.path.join(site, rel)
    dst = src + '.new.mp4'
    print('二压', rel, '%.0fMB' % (os.path.getsize(src)/1e6))
    r = subprocess.run([exe, '-y', '-i', src, '-c:v', 'libx264', '-preset', 'medium',
                        '-crf', crf, '-vf', 'scale=-2:720', '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', dst],
                       capture_output=True)
    if r.returncode == 0:
        new = os.path.getsize(dst)
        print('  -> %.0fMB' % (new/1e6), 'OK' if new < 95e6 else '仍超限')
        if new < 100e6:
            os.replace(dst, src)
    else:
        print('  失败', r.returncode)
print('done')
