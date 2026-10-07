import imageio_ffmpeg, subprocess, os

exe = imageio_ffmpeg.get_ffmpeg_exe()
src = os.path.join(r'D:\灵犀浏览器\users\467461855\projects\11649694727078122\workspace\resume-site', 'assets/videos/wanying/wanying-1080p.mp4')
dst = src + '.new.mp4'
r = subprocess.run([exe, '-y', '-i', src, '-c:v', 'libx264', '-preset', 'medium',
                    '-crf', '34', '-maxrate', '700k', '-bufsize', '1400k',
                    '-vf', 'scale=-2:720', '-pix_fmt', 'yuv420p',
                    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', dst],
                   capture_output=True)
if r.returncode == 0:
    new = os.path.getsize(dst)
    print('-> %.0fMB' % (new/1e6), 'OK' if new < 95e6 else '仍超限')
    if new < 98e6:
        os.replace(dst, src)
        print('已替换')
else:
    print('失败', r.returncode, r.stderr[-200:])
print('done')
