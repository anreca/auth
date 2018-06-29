**NOTA: El desarrollo de la aplicación todavia está en proceso, código incompleto.**

# Configuración del servidor en una Raspberry Pi

Configuración de la Raspberry Pi para crear el servidor de autenticación y las aplicaciones de prueba.

## Índice de contenidos

- [Características](#características)
- [Prerequisitos](#prerequisitos)
- [Configuración de dependencias en Raspbian](#configuración-de-dependencias-en-raspbian)
- [Configuración servidor Nginx](#configuración-servidor-nginx)
- [Configuración del dominio](#configuración-del-dominio)
- [Let's Encrypt](#let's-encrypt)
- [Licencia](#licencia)

# Características

- Instalación de **Node.js** y dependencias.
- Instalación de **MongoDB** y dependencias.
- Instalación y configuración de **Nginx** como Reverse Proxy.
- Encriptación de las comunicaciones con Let's Encrypt.

# Prerequisitos

- **Raspberry Pi 3.** con una fuente de alimentación y un cable HDMI.
- Sistema Operativo **Raspbian** instalado en la Raspberry.
- Tarjeta **Micro SD** de mínimo 16 GB.
- Dominio.


## Configuración de de dependencias en Raspbian

Para implementar el sistema de autenticación se utiliza una raspberry con el sistema operativo Raspbian.

1) Iniciar sesión con la contraseña por defecto y modificarlas
```
        usuario: pi
        contraseña: raspberry
        $ sudo passwd pi
        $ sudo passwd root

```

2) Asignar una IP estática a la raspberry y abrir los puertos 22 y 80 del router.

```
        $ sudo nano /etc/dhcpcd.conf
```

 - Añadir al fichero el siguiente texto, substituir X por un número entre 10 y 30:
 ```
 interface eth0

static ip_address=192.168.1.X/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1

interface wlan0

static ip_address=192.168.1.X/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1
 ```
3) Reiniciar la raspberry
 ```
         $ sudo reboot now
 ```
4)Actualizar los packages
```
        $ sudo apt-get update
        $ sudo apt-get full-upgrade -y
```

5)Instalar dependencias de Nodejs   
```
        $ sudo apt-get install -y build-essential
```

6) Instalar el repositorios de NodeSource y Nodejs
```
        $ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
        $ sudo apt-get install -y nodejs
```

7) Instalación de MongoDB
```
        $ sudo apt-get install mongodb
```

8) Instalar Nginx
```
        $ sudo apt-get install nginx
        $ sudo update-rc.d nginx defaults
```

9) Comprobar la versión instalada
```
        $ node -v
        $ npm -v
        $ mongo --version
        $ nginx -v
```
## Configuración servidor Nginx

1) Configurar servidor Nginx como Reverse Proxy Server

```
        $ sudo mkdir -p /var/www/authentication/public
        $ sudo mkdir -p /var/www/domain1/public
        $ sudo mkdir -p /var/www/domain2/public
        $ sudo chown www-data:www-data /var/www/
        $ sudo chmod -R 755 /var/www/
        $ sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/authentication
        $ sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/domain1

```
2) Configuración del servidor de autenticación.
```
        $ sudo nano /etc/nginx/sites-available/authentication
```

```
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        # SSL configuration
        # listen 443 ssl default_server;
        # listen [::]:443 ssl default_server;

        root /var/www/authentication/public;

        index index.html index.htm index.nginx-debian.html;

        server_name ssoauthentication.bid www.ssoauthentication.bid;

        location ~ /.well-known {
                allow all;
        }


        location / {
                try_files $uri $uri/ =404;
        }
}
```
3) Configuración de la página web de test 1:
```
      $ sudo nano /etc/nginx/sites-available/domain1
```

```
server {
        listen 80;
        listen [::]:80;

        # SSL configuration
        # listen 443 ssl default_server;
        # listen [::]:443 ssl default_server;

        root /var/www/domain1/public;

        index index.html index.htm index.nginx-debian.html;

        server_name testdomain1.bid www.testdomain1.bid;

        location ~ /.well-known {
                allow all;
        }

        location / {
                try_files $uri $uri/ =404;
        }
```

4) Desactivar default site y activar nuevos sites configurados

```
      $ sudo rm /etc/nginx/sites-enabled/default
      $ sudo ln -s /etc/nginx/sites-available/authentication /etc/nginx/sites-enabled/
      $ sudo ln -s /etc/nginx/sites-available/domain1 /etc/nginx/sites-enabled/
      $ sudo systemctl reload nginx
```
## Configuración del dominio
https://www.namecheap.com/support/knowledgebase/article.aspx/9356/11/how-to-configure-a-ddwrt-router
1) Obtención del dominio en Namecheap

2)Configurar Advanced DNS y añadir A Record, "www" y la IP a "apuntar".

# Let's Encrypt
https://clouding.io/kb/instalacion-servidor-web-nginx-letsencrypt-ubuntu/
https://www.howtoforge.com/tutorial/install-letsencrypt-and-secure-nginx-in-debian-9/

1) Instalar el cliente Let's Encrypt
```
      $ sudo apt-get install letsencrypt
      $ sudo sed -i "$ a\deb http://ftp.debian.org/debian stretch-backports main" /etc/apt/sources.list
      $ sudo apt-get update
      $ sudo apt-get install certbot -t stretch-backports -y --force-yes

```
2) Generar los certificados SSL para cada website
```
      $ sudo certbot certonly --webroot --webroot-path=/var/www/authentication/views -d www.ssoauthentication.bid -d www.ssoauthentication.bid
      $ sudo certbot certonly --webroot --webroot-path=/var/www/domain1/public -d www.testdomain1.bid -d www.testdomain1.bid
```

3) Generar Diffie Hellman
````
      $  openssl dhparam -out /etc/nginx/dhparam.pem 2048

````

4) Configurar Nginx para TLS (SSL)

Fichero configuración ssoauthentication
```
server {
        # SSL configuration
        listen 443 ssl default_server;

        root /var/www/authentication/views;
        index index.html index.htm index.nginx-debian.html;
        server_name ssoauthentication.bid www.ssoauthentication.bid;

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;


        #SSL Certificates
        ssl_certificate /etc/letsencrypt/live/www.ssoauthentication.bid/cert.pem;
        ssl_certificate_key /etc/letsencrypt/live/www.ssoauthentication.bid/privkey.pem;
        ssl_dhparam /etc/nginx/dhparam.pem;

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 10m;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;

        add_header Strict-Transport-Security "max-age=31536000;
        #includeSubDomains" always;

        location ~ \.php$ {
                include snippets/fastcgi-php.conf;
                fastcgi_pass unix:/var/run/php/php7.0-fpm.sock;
        }

        location ~ /.well-known {
                allow all;
        }

        location / {
                try_files $uri $uri/ =404;
        }
}
```
Fichero configuración domain1
```
# Default server configuration

server {
        listen 443 ssl;
        listen [::]:443 ssl;

        server_name testdomain1.bid www.testdomain1.bid;

        root /var/www/domain1/public;

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        #SSL Certificates
        ssl_certificate /etc/letsencrypt/live/www.testdomain1.bid/cert.pem;
        ssl_certificate_key /etc/letsencrypt/live/www.testdomain1.bid/privkey.pem;
        ssl_dhparam /etc/nginx/dhparam.pem;

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;

        ssl_session_cache shared:SSL:1m;
        ssl_session_timeout 10m;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers  on;

        add_header Strict-Transport-Security "max-age=31536000;
        #includeSubDomains" always;

        index index.html index.htm index.nginx-debian.html;

        location ~ /.well-known {
                allow all;
        }

        location ~ \.php$ {
                include snippets/fastcgi-php.conf;
                fastcgi_pass unix:/var/run/php/php7.0-fpm.sock;
        }
        location / {
                try_files $uri $uri/ =404;
        }
}
```

## NO-IP como alternativa (no testeado)

1)Configuración del acceso al dominio a través de No-IP
```
        $ wget http://www.no-ip.com/client/linux/noip-duc-linux.tar.gz
        $ tar -zxvf noip-duc-linux.tar.gz
        $ cd noip-2.1.9-1
        $ sudo make
        $ sudo make install
```
2) Creación de la ejecución automática al iniciar la Raspberry
```
        $ sudo nano /etc/init.d/noip2
```
Añadimos el siguiente texto al fichero: "sudo /usr/local/bin/noip2" y otorgamos permisos.
```
        $ sudo chmod +x /etc/init.d/noip2
        $ sudo chmod -R 775 /var/www
        $ sudo update-rc.d noip2 defaults
        $ sudo /usr/local/bin/noip2
```

# Licencia
Copyright (c) 2017 Antonia Retamal
