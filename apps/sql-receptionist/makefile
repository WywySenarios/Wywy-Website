CC = gcc
CFLAGS = -I/usr/include/postgresql
LDFLAGS = -L/usr/lib/x86_64-linux-gnu/ -lpq -lcyaml
TARGET = app.exe

app: $(SRC)
	$(CC) $(CFLAGS) *.c -o $(TARGET) $(LDFLAGS)
	./$(TARGET)