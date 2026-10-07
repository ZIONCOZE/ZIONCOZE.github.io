import imageio_ffmpeg, subprocess, os, shutil

exe = imageio_ffmpeg.get_ffmpeg_exe()
site = r'D:\灵犀浏览器\users\467461855\projects\11649694727078122\workspace\resume-site'
backup = r'D:\灵犀浏览器\users\467461855\projects\11649694727078122\workspace\videos_originals_backup'
os.makedirs(backup, exist_ok=True)

targets = [
    'assets/videos/wanying/wanying-1080p.mp4',
    'assets/videos/others/lonely.mp4',
    'assets/videos/others/culture.mp4',
]

for rel in targets:
    src = os.path.join(site, rel)
    dst = src + '.new.mp4'
    # 备份原件
    bdir = os.path.join(backup, os.path.dirname(rel))
    os.makedirs(bdir, exist_ok=True)
    if not os.path.exists(os.path.join(backup, rel)):
        print('备份', rel)
        shutil.copy2(src, os.path.join(backup, rel))
    print('压缩', rel, '%.0fMB' % (os.path.getsize(src)/1e6))
    r = subprocess.run([exe, '-y', '-i', src, '-c:v', 'libx264', '-preset', 'medium',
                        '-crf', '27', '-vf', 'scale=-2:720', '-pix_fmt', 'yuv420p',
                        '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst],
                       capture_output=True, text=True)
    if r.returncode == 0:
        old, new = os.path.getsize(src), os.path.getsize(dst)
        print('  -> %.0fMB -> %.0fMB' % (old/1e6, new/1e6))
        os.replace(dst, src)
    else:
        print('  失败:', r.stderr[-300:])
print('done')
