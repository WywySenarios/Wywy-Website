CC = gcc
CFLAGS = -I/mnt/c/Program\ Files/PostgreSQL/17/include
LDFLAGS = -L/mnt/c/Program\ Files/PostgreSQL/17/lib -lpq -lcyaml
TARGET = app.exe

app: $(SRC)
	$(CC) $(CFLAGS) *.c -o $(TARGET) $(LDFLAGS)
	./$(TARGET)