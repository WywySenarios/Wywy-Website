CC = gcc
CFLAGS = -I/mnt/c/Program\ Files/PostgreSQL/17/include
LDFLAGS = -L/mnt/c/Program\ Files/PostgreSQL/17/lib -lpq -lcyaml
TARGET = app.exe
SRC = app.c

app: $(SRC)
	$(CC) $(CFLAGS) $(SRC) -o $(TARGET) $(LDFLAGS)
	./$(TARGET)