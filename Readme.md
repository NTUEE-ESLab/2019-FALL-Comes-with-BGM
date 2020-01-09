# NTU ESLab 2019 FALL Comes with BGM

### 1. Motivation
  Smart home applications thrived up due to the prevalent of IoT and smartphones. Their functions might be different but all with a view to either save energy and money or make human's life more conveneient. It happened to everyone that we leave our home without turning the lights and appliances off. Therefore, we came up with the idea to detect where the users are and hence automatically turn on/off home appliances using STM32 and Rpi. 
### 2. Enviornment & Depedency
- STM32
	- Mbed-os 5.15.0
	- Wifi-ism43362
	- Mbed-os-example-ble-GattServer
- Rpi
	- Python 3.6.8		
### 3. Prerequisties & Installation
```bash
$ pip install pycrpytodome
$ pip install flask
# Install yarn (Please refer to the official website)
$ yarn install
# maybe need to yarn add unmet depedencies
# yarn add xxxx@xx.xx.xx
```
### 4. Execution
```bash
$ cd Webserver/
# Start Frontend, Open one terminal
$ yarn start
# Start Backend, Open one terminal
$ cd backend/
# If you want to change ip address and port, please modify shell script and also modify WebServer/src/constants/ServerInfo.js 
$ . start.sh 
# Connect Everything
$ cd ../SystemController_Rpi/
$ python3 merge.py
```
### 5. Methods

![1578570843427](https://i.imgur.com/reiBWD9.png)

  Our system aims to develop a smart audio player with capability of detecting which room the user is in and playing songs in that room. In our demo, we show that we can control the Bluetooth speaker remotely from the laptop and when the user leaves the room (the ble connection breaks up), the player will stop the music.
  There are five components in our components, **web app, system controller, bluetooth speaker, ble scanner, smartphone.** 

- **Web app** provides a user interface to control the Bluetooth speaker.

- **System controller** integrates the signal from web server and ble scanner and directly controls the Bluetooth speaker.

- **Smartphone** indicate the location of the user

- **Ble scanner** scan the signal broadcasts from the smartphone

- **Bluetooth speaker** play songs and is able to control volume

  Web app is executed on the laptop. The app indicates the user’s location and to control the songs to play. React js is used for frontend development and python’s flask is used for backend. 
  A multi thread system controller is built on rpi. It connects to the web server and the ble scanner to decide which song to play, whether to pause the song and directly control the speaker. Python are used to develop the system. 
  STM board plays the role of ble scanner. While the STM receives ble signal from the user, it will send signals to system controller (rpi) via tcp connection.

### 6. Difficulties

**1.** To setup the connection between rpi and the speaker, we faced some difficulties. The audio driver alsa doesn’t support the ble connection.  **=>** After trials, we found that there are another driver called bluealsa can bind the alsa and ble together

**2.** When dealing with the stm board, we found that there are no available examples using both tcp and ble => we integrate the two examples together

**3.** Backend Server needs to handle request from different address, and synchronize the data to be on the same value.

### 7. Reference
- https://linux.die.net/man/1/aplay
- https://os.mbed.com/handbook/Socket
- https://github.com/Arkq/bluez-alsa

### 8. Demo

[**demo**](https://drive.google.com/file/d/1n_gmnvahOBqZWKZ73KAVdSK3oRAXymrh/view?usp=sharing)

