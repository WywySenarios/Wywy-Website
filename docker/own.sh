cd ../apps/
sudo chown root sql-receptionist
sudo chmod 777 sql-receptionist

cd sql-receptionist
# The wildcard might miss hidden files.
sudo chown -R root *
sudo chmod -R 777 *
cd ../../docker