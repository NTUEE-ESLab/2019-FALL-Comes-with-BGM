#include "mbed.h"
extern "C"{
    #include "wifi.h"
    
}
#include "ISM43362Interface.h"

#include "platform/Callback.h"
#include "events/EventQueue.h"
#include "platform/NonCopyable.h"

#include "ble/BLE.h"
#include "ble/Gap.h"
#include "ble/GattClient.h"
#include "ble/GapAdvertisingParams.h"
#include "ble/GapAdvertisingData.h"
#include "ble/GattServer.h"

#include "BLEProcess.h"



using mbed::callback;

class ConnectService {
    typedef ConnectService Self;
    public:
    
        ConnectService():
            _hour_char("485f4145-52b9-4644-af1f-7a6b9322490f", 0),
            _minute_char("0a924ca7-87cd-4699-a3bd-abdcd9cf126a", 0),
            _second_char("0a924ca7-87cd-4699-a3bd-abdcd9cf126b", 0),
            _smart_home(
                /* uuid */ "51311102-030e-485f-b122-f8f381aa84ed",
                /* characteristics */ _clock_characteristics,
                /* numCharacteristics */ 2
            ),
            _server(NULL),
            _event_queue(NULL)
            {
        // update internal pointers (value, descriptors and characteristics array)
                _clock_characteristics[0] = &_hour_char;
                _clock_characteristics[1] = &_hour_char;

                // setup authorization handlers
                _hour_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
                _minute_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
            }
        //     _hour_char("485f4145-52b9-4644-af1f-7a6b9322490f", 0),
        //     _minute_char("0a924ca7-87cd-4699-a3bd-abdcd9cf126a", 0),
        //     _second_char("8dd6a1b7-bc75-4741-8a26-264af75807de", 0),
        //     _smart_home(
        //         /* uuid */ "51311102-030e-485f-b122-f8f381aa84ed",
        //         /* characteristics */ _clock_characteristics,
        //         /* numCharacteristics */ 2
        //     ),
        //     _server(NULL),
        //     _event_queue(NULL)
        // {
        //     // update internal pointers (value, descriptors and characteristics array)
        //     _clock_characteristics[0] = &_hour_char;
        //     _clock_characteristics[1] = &_minute_char;
        //     // _clock_characteristics[2] = &_second_char;

        //     // setup authorization handlers
        //     _hour_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
        //     _minute_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
        //     // _second_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
        // }
            
        void start(BLE &ble_interface, events::EventQueue &event_queue)
    {
         if (_event_queue) {
            return;
        }
        printf("coooooonnect");
        _server = &ble_interface.gattServer();
        _event_queue = &event_queue;

        // register the service
        printf("Adding demo service\r\n");
        ble_error_t err = _server->addService(_smart_home);

        if (err) {
            printf("Error %u during demo service registration.\r\n", err);
            return;
        }

        // read write handler
        _server->onDataSent(as_cb(&Self::when_data_sent));
        _server->onDataWritten(as_cb(&Self::when_data_written));
        _server->onDataRead(as_cb(&Self::when_data_read));

        // updates subscribtion handlers
        _server->onUpdatesEnabled(as_cb(&Self::when_update_enabled));
        _server->onUpdatesDisabled(as_cb(&Self::when_update_disabled));
        _server->onConfirmationReceived(as_cb(&Self::when_confirmation_received));

        // print the handles
        printf("clock service registered\r\n");
        printf("service handle: %u\r\n", _smart_home.getHandle());
        printf("\thour characteristic value handle %u\r\n", _hour_char.getValueHandle());
        printf("\tminute characteristic value handle %u\r\n", _minute_char.getValueHandle());
        // printf("\tsecond characteristic value handle %u\r\n", _second_char.getValueHandle());

        // _event_queue->call_every(1000 /* ms */, callback(this, &Self::increment_second));
    }
    private:
        void authorize_client_write(GattWriteAuthCallbackParams *e)
        {

            e->authorizationReply = AUTH_CALLBACK_REPLY_SUCCESS;
        }
        void when_data_sent(unsigned count){
            printf("data sent\n");
        }
        void when_data_read(const GattReadCallbackParams *e){
            printf("data read\n");
        }
        void when_data_written(const GattWriteCallbackParams *e){
            printf("data written\n");
        }
        void when_update_enabled(GattAttribute::Handle_t handle)
        {
            printf("update enabled on handle %d\r\n", handle);
        }

        /**
        * Handler called after a client has cancelled his subscription from
        * notification or indication.
        *
        * @param handle Handle of the characteristic value affected by the change.
        */
        void when_update_disabled(GattAttribute::Handle_t handle)
        {
            printf("update disabled on handle %d\r\n", handle);
        }

        /**
        * Handler called when an indication confirmation has been received.
        *
        * @param handle Handle of the characteristic value that has emitted the
        * indication.
        */
        void when_confirmation_received(GattAttribute::Handle_t handle)
        {
            printf("confirmation received on handle %d\r\n", handle);
        }

         void increment_second(void)
        {
            uint8_t second = 0;
            ble_error_t err = _minute_char.get(*_server, second);
            if (err) {
                printf("read of the second value returned error %u\r\n", err);
                return;
            }

            second = (second + 1) % 60;

            err = _minute_char.set(*_server, second);
            printf("update\n");
            if (err) {
                printf("write of the second value returned error %u\r\n", err);
                return;
            }
        }
        template<typename Arg>
            FunctionPointerWithContext<Arg> as_cb(void (Self::*member)(Arg))
            {
                return makeFunctionPointer(this, member);
            }
         template<typename T>
            class ReadWriteNotifyIndicateCharacteristic : public GattCharacteristic {
            public:
                /**
                * Construct a characteristic that can be read or written and emit
                * notification or indication.
                *
                * @param[in] uuid The UUID of the characteristic.
                * @param[in] initial_value Initial value contained by the characteristic.
                */
                ReadWriteNotifyIndicateCharacteristic(const UUID & uuid, const T& initial_value) :
                    GattCharacteristic(
                        /* UUID */ uuid,
                        /* Initial value */ &_value,
                        /* Value size */ sizeof(_value),
                        /* Value capacity */ sizeof(_value),
                        /* Properties */ GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_READ |
                                        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_WRITE |
                                        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_NOTIFY |
                                        GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_INDICATE,
                        /* Descriptors */ NULL,
                        /* Num descriptors */ 0,
                        /* variable len */ false
                    ),
                    _value(initial_value) {
                }

                /**
                * Get the value of this characteristic.
                *
                * @param[in] server GattServer instance that contain the characteristic
                * value.
                * @param[in] dst Variable that will receive the characteristic value.
                *
                * @return BLE_ERROR_NONE in case of success or an appropriate error code.
                */
                ble_error_t get(GattServer &server, T& dst) const
                {
                    uint16_t value_length = sizeof(dst);
                    return server.read(getValueHandle(), &dst, &value_length);
                }

                /**
                * Assign a new value to this characteristic.
                *
                * @param[in] server GattServer instance that will receive the new value.
                * @param[in] value The new value to set.
                * @param[in] local_only Flag that determine if the change should be kept
                * locally or forwarded to subscribed clients.
                */
                ble_error_t set(
                    GattServer &server, const uint8_t &value, bool local_only = false
                ) const {
                    return server.write(getValueHandle(), &value, sizeof(value), local_only);
                }

            private:
                uint8_t _value;
            };

    // ReadWriteNotifyIndicateCharacteristic<int> mac_addr;
    // ReadWriteNotifyIndicateCharacteristic<uint8_t> room_id;

    // GattCharacteristic* _connect_characteristics[2];

    // GattService _smart_home;

    // events::EventQueue *_event_queue;
    // GattServer* _server;
    ReadWriteNotifyIndicateCharacteristic<int> _hour_char;
    ReadWriteNotifyIndicateCharacteristic<uint8_t> _minute_char;
    ReadWriteNotifyIndicateCharacteristic<uint8_t> _second_char;

    // list of the characteristics of the clock service
    GattCharacteristic* _clock_characteristics[2];

    // demo service
    GattService _smart_home;

    GattServer* _server;
    events::EventQueue *_event_queue;

};

#if (defined(TARGET_DISCO_L475VG_IOT01A) || defined(TARGET_DISCO_F413ZH))
#include "ISM43362Interface.h"
ISM43362Interface* wifi;
#endif
Serial pc(SERIAL_TX, SERIAL_RX);








































class ClockService {
    typedef ClockService Self;

public:
    ClockService() :
        _hour_char("485f4145-52b9-4644-af1f-7a6b9322490f", 0),
        _minute_char("0a924ca7-87cd-4699-a3bd-abdcd9cf126a", 0),
        _second_char("8dd6a1b7-bc75-4741-8a26-264af75807de", 0),
        _smart_home(
            /* uuid */ "51311102-030e-485f-b122-f8f381aa84ed",
            /* characteristics */ _clock_characteristics,
            /* numCharacteristics */ sizeof(_clock_characteristics) /
                                     sizeof(_clock_characteristics[0])
        ),
        _server(NULL),
        _event_queue(NULL)
    {
        // update internal pointers (value, descriptors and characteristics array)
        _clock_characteristics[0] = &_hour_char;
        _clock_characteristics[1] = &_minute_char;
        _clock_characteristics[2] = &_second_char;

        // setup authorization handlers
        _hour_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
        _minute_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
        _second_char.setWriteAuthorizationCallback(this, &Self::authorize_client_write);
    }



    void start(BLE &ble_interface, events::EventQueue &event_queue)
    {
         if (_event_queue) {
            return;
        }
        printf("coooooonnect");
        _server = &ble_interface.gattServer();
        _event_queue = &event_queue;

        // register the service
        printf("Adding demo service\r\n");
        ble_error_t err = _server->addService(_smart_home);

        if (err) {
            printf("Error %u during demo service registration.\r\n", err);
            return;
        }

        // read write handler
        _server->onDataSent(as_cb(&Self::when_data_sent));
        _server->onDataWritten(as_cb(&Self::when_data_written));
        _server->onDataRead(as_cb(&Self::when_data_read));

        // updates subscribtion handlers
        _server->onUpdatesEnabled(as_cb(&Self::when_update_enabled));
        _server->onUpdatesDisabled(as_cb(&Self::when_update_disabled));
        _server->onConfirmationReceived(as_cb(&Self::when_confirmation_received));

        // print the handles
        printf("clock service registered\r\n");
        printf("service handle: %u\r\n", _smart_home.getHandle());
        printf("\thour characteristic value handle %u\r\n", _hour_char.getValueHandle());
        printf("\tminute characteristic value handle %u\r\n", _minute_char.getValueHandle());
        printf("\tsecond characteristic value handle %u\r\n", _second_char.getValueHandle());

        // _event_queue->call_every(1000 /* ms */, callback(this, &Self::increment_second));
    }

private:

    /**
     * Handler called when a notification or an indication has been sent.
     */
    void when_data_sent(unsigned count)
    {
        printf("sent %u updates\r\n", count);
    }

    /**
     * Handler called after an attribute has been written.
     */
    void when_data_written(const GattWriteCallbackParams *e)
    {
        printf("data written:\r\n");
        printf("\tconnection handle: %u\r\n", e->connHandle);
        printf("\tattribute handle: %u", e->handle);
        if (e->handle == _hour_char.getValueHandle()) {
            printf(" (hour characteristic)\r\n");
        } else if (e->handle == _minute_char.getValueHandle()) {
            printf(" (minute characteristic)\r\n");
        } else if (e->handle == _second_char.getValueHandle()) {
            printf(" (second characteristic)\r\n");
        } else {
            printf("\r\n");
        }
        printf("\twrite operation: %u\r\n", e->writeOp);
        printf("\toffset: %u\r\n", e->offset);
        printf("\tlength: %u\r\n", e->len);
        printf("\t data: ");

        for (size_t i = 0; i < e->len; ++i) {
            printf("%02X", e->data[i]);
        }

        printf("\r\n");
    }

    /**
     * Handler called after an attribute has been read.
     */
    void when_data_read(const GattReadCallbackParams *e)
    {
        printf("data read:\r\n");
        printf("\tconnection handle: %u\r\n", e->connHandle);
        printf("\tattribute handle: %u", e->handle);
        if (e->handle == _hour_char.getValueHandle()) {
            printf(" (hour characteristic)\r\n");
        } else if (e->handle == _minute_char.getValueHandle()) {
            printf(" (minute characteristic)\r\n");
        } else if (e->handle == _second_char.getValueHandle()) {
            printf(" (second characteristic)\r\n");
        } else {
            printf("\r\n");
        }
    }

    /**
     * Handler called after a client has subscribed to notification or indication.
     *
     * @param handle Handle of the characteristic value affected by the change.
     */
    void when_update_enabled(GattAttribute::Handle_t handle)
    {
        printf("update enabled on handle %d\r\n", handle);
    }

    /**
     * Handler called after a client has cancelled his subscription from
     * notification or indication.
     *
     * @param handle Handle of the characteristic value affected by the change.
     */
    void when_update_disabled(GattAttribute::Handle_t handle)
    {
        printf("update disabled on handle %d\r\n", handle);
    }

    /**
     * Handler called when an indication confirmation has been received.
     *
     * @param handle Handle of the characteristic value that has emitted the
     * indication.
     */
    void when_confirmation_received(GattAttribute::Handle_t handle)
    {
        printf("confirmation received on handle %d\r\n", handle);
    }

    /**
     * Handler called when a write request is received.
     *
     * This handler verify that the value submitted by the client is valid before
     * authorizing the operation.
     */
    void authorize_client_write(GattWriteAuthCallbackParams *e)
    {
        printf("characteristic %u write authorization\r\n", e->handle);

        if (e->offset != 0) {
            printf("Error invalid offset\r\n");
            e->authorizationReply = AUTH_CALLBACK_REPLY_ATTERR_INVALID_OFFSET;
            return;
        }

        if (e->len != 1) {
            printf("Error invalid len\r\n");
            e->authorizationReply = AUTH_CALLBACK_REPLY_ATTERR_INVALID_ATT_VAL_LENGTH;
            return;
        }

        if ((e->data[0] >= 60) ||
            ((e->data[0] >= 24) && (e->handle == _hour_char.getValueHandle()))) {
            printf("Error invalid data\r\n");
            e->authorizationReply = AUTH_CALLBACK_REPLY_ATTERR_WRITE_NOT_PERMITTED;
            return;
        }

        e->authorizationReply = AUTH_CALLBACK_REPLY_SUCCESS;
    }

    /**
     * Increment the second counter.
     */
    void increment_second(void)
    {
        uint8_t second = 0;
        ble_error_t err = _second_char.get(*_server, second);
        if (err) {
            printf("read of the second value returned error %u\r\n", err);
            return;
        }

        second = (second + 1) % 60;

        err = _second_char.set(*_server, second);
        if (err) {
            printf("write of the second value returned error %u\r\n", err);
            return;
        }

        if (second == 0) {
            increment_minute();
        }
    }

    /**
     * Increment the minute counter.
     */
    void increment_minute(void)
    {
        uint8_t minute = 0;
        ble_error_t err = _minute_char.get(*_server, minute);
        if (err) {
            printf("read of the minute value returned error %u\r\n", err);
            return;
        }

        minute = (minute + 1) % 60;

        err = _minute_char.set(*_server, minute);
        if (err) {
            printf("write of the minute value returned error %u\r\n", err);
            return;
        }

        if (minute == 0) {
            increment_hour();
        }
    }

    /**
     * Increment the hour counter.
     */
    void increment_hour(void)
    {
        uint8_t hour = 0;
        ble_error_t err = _hour_char.get(*_server, hour);
        if (err) {
            printf("read of the hour value returned error %u\r\n", err);
            return;
        }

        hour = (hour + 1) % 24;

        err = _hour_char.set(*_server, hour);
        if (err) {
            printf("write of the hour value returned error %u\r\n", err);
            return;
        }
    }

private:
    /**
     * Helper that construct an event handler from a member function of this
     * instance.
     */
    template<typename Arg>
    FunctionPointerWithContext<Arg> as_cb(void (Self::*member)(Arg))
    {
        return makeFunctionPointer(this, member);
    }

    /**
     * Read, Write, Notify, Indicate  Characteristic declaration helper.
     *
     * @tparam T type of data held by the characteristic.
     */
    template<typename T>
    class ReadWriteNotifyIndicateCharacteristic : public GattCharacteristic {
    public:
        /**
         * Construct a characteristic that can be read or written and emit
         * notification or indication.
         *
         * @param[in] uuid The UUID of the characteristic.
         * @param[in] initial_value Initial value contained by the characteristic.
         */
        ReadWriteNotifyIndicateCharacteristic(const UUID & uuid, const T& initial_value) :
            GattCharacteristic(
                /* UUID */ uuid,
                /* Initial value */ &_value,
                /* Value size */ sizeof(_value),
                /* Value capacity */ sizeof(_value),
                /* Properties */ GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_READ |
                                GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_WRITE |
                                GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_NOTIFY |
                                GattCharacteristic::BLE_GATT_CHAR_PROPERTIES_INDICATE,
                /* Descriptors */ NULL,
                /* Num descriptors */ 0,
                /* variable len */ false
            ),
            _value(initial_value) {
        }

        /**
         * Get the value of this characteristic.
         *
         * @param[in] server GattServer instance that contain the characteristic
         * value.
         * @param[in] dst Variable that will receive the characteristic value.
         *
         * @return BLE_ERROR_NONE in case of success or an appropriate error code.
         */
        ble_error_t get(GattServer &server, T& dst) const
        {
            uint16_t value_length = sizeof(dst);
            return server.read(getValueHandle(), &dst, &value_length);
        }

        /**
         * Assign a new value to this characteristic.
         *
         * @param[in] server GattServer instance that will receive the new value.
         * @param[in] value The new value to set.
         * @param[in] local_only Flag that determine if the change should be kept
         * locally or forwarded to subscribed clients.
         */
        ble_error_t set(
            GattServer &server, const uint8_t &value, bool local_only = false
        ) const {
            return server.write(getValueHandle(), &value, sizeof(value), local_only);
        }

    private:
        uint8_t _value;
    };

    ReadWriteNotifyIndicateCharacteristic<uint8_t> _hour_char;
    ReadWriteNotifyIndicateCharacteristic<uint8_t> _minute_char;
    ReadWriteNotifyIndicateCharacteristic<uint8_t> _second_char;

    // list of the characteristics of the clock service
    GattCharacteristic* _clock_characteristics[3];

    // demo service
    GattService _smart_home;

    GattServer* _server;
    events::EventQueue *_event_queue;
    
    uint16_t Datalen;
    uint8_t RxData [500];
   
};



int main()
{   
    
    pc.baud(115200);
    printf("hihi\n");
    wifi = (ISM43362Interface*)(ISM43362Interface::get_default_instance());
    if (!wifi) {
        printf("ERROR: No WiFiInterface found.\n");
        return -1;
    }else{
        printf("good\n");
    }
    int ret = wifi->connect(MBED_CONF_APP_WIFI_SSID, MBED_CONF_APP_WIFI_PASSWORD, NSAPI_SECURITY_WPA_WPA2);
    if(ret == 0){
        printf("connect wifi successfully\n");
    }else{
        printf("error when connect to wifi\n");
    }
    TCPSocket socket;
    ret = socket.open(wifi);
    if(ret == 0){
        printf("open socket successfully\n");
    }else{
        printf("open socket error\n");
    }
    ret = socket.connect("192.168.43.153", 8002);
    if(ret == 0){
        printf("connect tcp server successfully\n");
    }else{
        printf("connect tcp server error\n");
    }
    char info[] = "connect";
    nsapi_size_t size = strlen(info);

    int result = socket.send("hi", 2);
    if(result > 0){
        printf("send connectiion info successfully\n");
    }else{
        printf("send connection info error: %d\n", result);
    }
    

    printf("\n\n\n\n\nstart ble init...\n");
    BLE &ble_interface = BLE::Instance();
    events::EventQueue event_queue;
    
    BLEProcess ble_process(event_queue, ble_interface, socket);

    ConnectService demo_service;
    ble_process.on_init(callback(&demo_service, &ConnectService::start));

    // ClockService demo_service;
    // ble_process.on_init(callback(&demo_service, &ClockService::start));

    ble_process.start();
    event_queue.dispatch_forever();

    

    
    
    

}


