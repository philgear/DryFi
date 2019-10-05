 #include "config.h"
 #include "DHT.h"
 // pin connected to DH22 data line
 #define DATA_PIN 2
 #define DHTTYPE DHT22

 // create DHT22 instance
 DHT_Unified dht(DATA_PIN, DHTTYPE, 11);
     
 // set up the 'temperature' and 'humidity' feeds
    AdafruitIO_Feed *temperature = io.feed("temperature");
    AdafruitIO_Feed *humidity = io.feed("humidity");

  void setup() {
  
  // start the serial connection
  Serial.begin(115200);
  
  // wait for serial monitor to open
  while(! Serial);
  
  // initialize dht22
  dht.begin();
  
  // connect to io.adafruit.com
  Serial.print("Connecting to Adafruit IO");
  io.connect();
  
  // wait for a connection
  while(io.status() < AIO_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  
  // we are connected
  Serial.println();
  Serial.println(io.statusText());

 }
   void loop() {
   
    // io.run(); is required for all sketches.
    // it should always be present at the top of your loop
    // function. it keeps the client connected to
    // io.adafruit.com, and processes any incoming data.
    io.run();
    sensors_event_t event;
    dht.temperature().getEvent(&event);
   
    float celsius = event.temperature;
    float fahrenheit = (celsius * 1.8) + 32;
   
    Serial.print("celsius: ");
    Serial.print(celsius);
    Serial.println("C");
   
    Serial.print("fahrenheit: ");
    Serial.print(fahrenheit);
    Serial.println("F");
   
    // save fahrenheit (or celsius) to Adafruit IO
    temperature->save(fahrenheit);
          dht.humidity().getEvent(&event);
   
    Serial.print("humidity: ");
    Serial.print(event.relative_humidity);
    Serial.println("%");
   
    // save humidity to Adafruit IO
    humidity->save(event.relative_humidity);
   
    // wait 5 seconds (5000 milliseconds == 5 seconds)
    delay(5000);
   
  }
