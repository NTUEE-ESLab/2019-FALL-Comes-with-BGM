import os
import time
import socket
import threading
import requests

def song(song_name):
	os.system('amixer -D  bluealsa sset \'BTS-698 - SCO\' 3%')
	os.system('sudo killall aplay')
	time.sleep(1)
	os.system(f'aplay -D bluealsa /home/pi/final/songs/{song_name}.wav &')
def setVolume(volume):
	os.system(f'amixer -D  bluealsa sset \'BTS-698 - SCO\' {volume}%')
def pause():
	os.system('sudo pkill -STOP aplay')
def resume():
	os.system('sudo pkill -CONT aplay')


os.system('bluetoothctl connect 00:58:56:7f:f2:26')
time.sleep(1)
print('connect bluetooth speaker done')
IP_PORT = 8002

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# close port when process exits:
serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
#debug("Socket created")
HOSTNAME = "" # Symbolic name meaning all available interfaces
try:
    serverSocket.bind((HOSTNAME, IP_PORT))
except socket.error as msg:
    print( "Bind failed", msg[0], msg[1])
    sys.exit()
serverSocket.listen(10)
print('open tcp server done')
info = {
	'song_name': None,
	'status': 'play',
	'volume': 3,
	'connect': 0
}
def httpRequests():
	# url = ''
	# r = requests.get(url)
	# text = r.text
	# print(r.text)
	while True:
		r = requests.post('http://192.168.43.113:8787/rpi_query', json={'room': info['connect']})
		print(r.json())
		r = r.json()['data']
		if r['song_name'] != '':
			song(r['song_name'])
			info['song_name'] = r['song_name']
		if r['volume'] != '':
			if r['volume'] == 'up':
				info['volume'] += 5
				info['volume'] = min(info['volume'], 100)
				setVolume(info['volume'])
			if r['volume'] == 'down':
				info['volume'] -= 5
				info['volume'] = max(info['volume'], 0)
				setVolume(info['volume'])
		if r['status'] != '':
			if r['status'] == 'play':
				info['status'] = 'play'
				resume()
			if r['status'] == 'pause':
				info['status'] = 'pause'
				pause()
		
		# if text == 'song1':
		# 	song1()
		# elif text == 'song2':
		# 	song2()
		time.sleep(1)


t = threading.Thread(target = httpRequests)
t.start()
while True:

	conn, addr = serverSocket.accept()
	print(conn, addr)
	while True:
		recv = conn.recv(1024)
		if recv:
			if recv == b'connect':
				print('connect')
				info['connect'] = 1
				resume()
				
			elif recv == b'disconnect':
				print('disconnect')
				info['connect'] = 0
				pause()
				
				
			print(recv)
