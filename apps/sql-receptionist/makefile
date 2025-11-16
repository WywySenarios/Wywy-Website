SRC = $(wildcard *.c)
CC = gcc
CFLAGS = -I/usr/include/postgresql
LDFLAGS = -L/usr/lib/x86_64-linux-gnu/ -lpq -lcyaml -ljansson
TARGET = app

app: $(SRC)
	$(CC) $(CFLAGS) *.c -o $(TARGET) $(LDFLAGS)

clean:
	rm -f $(TARGET)