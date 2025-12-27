USER=pc

cd ../apps/
sudo chown root sql-receptionist
sudo chmod 777 sql-receptionist

cd sql-receptionist
# The wildcard might miss hidden files.
sudo chown -R root *
sudo chmod -R 777 *
cd ../../docker

# postgres ownership
sudo chmod 644 ./../apps/postgres/postgresql.conf
sudo chmod 644 ./../apps/postgres/pg_hba.conf