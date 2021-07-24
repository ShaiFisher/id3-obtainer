Id3 Optainer for Hebrew songs mp3 files

Run:
node scanMusicDir.js mydir

App will try to get the details from Shironet and fill it in the file id3 tag.

After the scan is complete, go over the errors report to make decisions regarding unsured files:
npm run start:listener
npm run start:app
