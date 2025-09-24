// Arduino Nano - Eye Blink Sensor Morse Code
// No LCD, only Serial Monitor + LED + Buzzer

const int sensorPin = 2;   // Eye blink sensor OUT
const int buzzerPin = 3;   // Buzzer
const int ledPin = 4;      // LED

unsigned long blinkStart = 0;
bool isBlinking = false;

String currentSymbol = "";   // stores current Morse symbol (one letter)
String message = "";         // stores whole message

// Morse dictionary
struct MorseCode {
  const char *code;
  char letter;
};

MorseCode morseTable[] = {
  {".-", 'A'},   {"-...", 'B'}, {"-.-.", 'C'}, {"-..", 'D'},  {".", 'E'},
  {"..-.", 'F'}, {"--.", 'G'},  {"....", 'H'}, {"..", 'I'},   {".---", 'J'},
  {"-.-", 'K'},  {".-..", 'L'}, {"--", 'M'},   {"-.", 'N'},   {"---", 'O'},
  {".--.", 'P'}, {"--.-", 'Q'}, {".-.", 'R'},  {"...", 'S'},  {"-", 'T'},
  {"..-", 'U'},  {"...-", 'V'}, {".--", 'W'},  {"-..-", 'X'}, {"-.--", 'Y'},
  {"--..", 'Z'},
  {".----", '1'}, {"..---", '2'}, {"...--", '3'}, {"....-", '4'}, {".....", '5'},
  {"-....", '6'}, {"--...", '7'}, {"---..", '8'}, {"----.", '9'}, {"-----", '0'}
};

void setup() {
  pinMode(sensorPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);

  Serial.begin(9600);
  Serial.println("=== Morse Code Eye Blink System ===");
  Serial.println("Short blink = DOT, Long blink = DASH");
  Serial.println("Look here for decoded letters/words:");
}

void loop() {
  int sensorState = digitalRead(sensorPin);
  unsigned long now = millis();

  if (sensorState == HIGH && !isBlinking) {
    // Blink started
    isBlinking = true;
    blinkStart = now;
  }

  if (sensorState == LOW && isBlinking) {
    // Blink ended
    isBlinking = false;
    unsigned long blinkDuration = now - blinkStart;

    if (blinkDuration < 400) {
      // DOT
      currentSymbol += ".";
      playMorse(200);
    } else {
      // DASH
      currentSymbol += "-";
      playMorse(600);
    }
  }

  // Detect end of letter (if no blink for 1 sec)
  static unsigned long lastAction = 0;
  if (sensorState == HIGH || isBlinking) {
    lastAction = now;
  } else if (now - lastAction > 1000 && currentSymbol.length() > 0) {
    // End of one letter
    char decoded = decodeMorse(currentSymbol);
    if (decoded != '?') {
      message += decoded;
      Serial.print(decoded);
    }
    currentSymbol = "";
  }

  // Detect end of word (pause > 3 sec)
  if (now - lastAction > 3000 && message.length() > 0) {
    Serial.println();  // new line after word
    message = "";
  }
}

void playMorse(int duration) {
  digitalWrite(ledPin, HIGH);
  tone(buzzerPin, 1000);
  delay(duration);
  digitalWrite(ledPin, LOW);
  noTone(buzzerPin);
  delay(200); // short gap
}

char decodeMorse(String symbol) {
  for (unsigned int i = 0; i < sizeof(morseTable) / sizeof(MorseCode); i++) {
    if (symbol.equals(morseTable[i].code)) {
      return morseTable[i].letter;
    }
  }
  return '?'; // unknown symbol
}