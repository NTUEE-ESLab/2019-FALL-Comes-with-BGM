from mutagen.mp3 import MP3
import os
import json
import datetime

songs = os.listdir('.')

for song in songs:
	if song.endswith('.mp3'):
		audio = MP3(song)
		m, s = divmod(audio.info.length, 60)
		h, m = divmod(m, 60)
		m = str(m).split('.')[0]
		s = str(s).split('.')[0]
		if len(s) < 2:
			s = '0' + s
		time_length = m + ":" + s
		singer, name = song.split('.')[0].split(' ')

		print(singer, name, time_length)

