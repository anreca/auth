            **NOTA: El desarrollo de la aplicación todavia está en proceso, código incompleto.**

# Desarrollo e implementación de una aplicación de autenticación de usuarios centralizada con Node.js

Sistema de autenticación de usuarios SSO unica para diferentes dominios a través de JSON web tokens.

## Índice de contenidos

- [Características](#características)
- [Prerequisitos](#prerefquisitos)
- [Configuracion del entorno de desarrollo](#configuración-del-entorno-de-desarrollo-en-linux)
- [Estructura](#estructura)
- [Packages](#packages)
- [Soporte](#soporte)
- [Licencia](#licencia)

# Cadracterísticas

- **Autenticación Local** usando el Email y Contraseña
- **Autenticación OAuth 2.0.** via Facebook y Google
- Reestablecimiento de la contraseña del usuario, enviando en el correo una url token.
- Notificaciónes Flash
- Estructura del proyecto MVC
- Bootstrap


# Prerequisitos

- [MongoDB ~v 3.4.3](https://www.mongodb.org/downloads)
- [Node.js ~v 8.10.0](http://nodejs.org)
- [Nginx ~v 1.10.3](http://nodejs.org)
- [Visual Studio Code](https://code.visualstudio.com/) o editor de código similar


## Configuración del entorno de desarrollo

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
 - Añadimos al fichero el siguiente texto, substituyendo X por un número entre 10 y 30:
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

9) Comprobamos la versión instalada
```
        $ node -v
        $ npm -v
        $ mongo --version
        $ nginx -v
```
## Ejecución para el desarrollo

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

2)Configurar Advanced DNS y añadir A Record, "www" y la IP a apuntar.


# Encriptar las comunicaciones con Let's Encrypt
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
https://www.howtoforge.com/tutorial/install-letsencrypt-and-secure-nginx-in-debian-9/
https://clouding.io/kb/instalacion-servidor-web-nginx-letsencrypt-ubuntu/

```
      $ sudo certbot certonly --webroot --webroot-path=/var/www/authentication/views -d www.ssoauthentication.bid -d www.ssoauthentication.bid
      $ sudo certbot certonly --webroot --webroot-path=/var/www/domain1/public -d www.testdomain1.bid -d www.testdomain1.bid
```

3) Generar Diffie Hellman
````
      $  openssl dhparam -out /etc/nginx/dhparam.pem 2048

````

4) Consfigurar Nginx para TLS (SSL)

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

## Configuración Servidor proveedor OpenID Connect

1)Configuración

## NO-IP

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
# Configuración para test de la aplicación

1) Descargarse el proyecto
2) Situarse en la carpeta del proyecto /auth
3) Descargar los packages npm
```
        $ sudo npm install
```
4)Configurar la cuenta de correo gmail soporte de recuperación de contraseñas:
tutorial email aqui --> http://sahatyalkabov.com/how-to-implement-password-reset-in-nodejs/

- Acceder a https://console.developers.google.com y en biblioteca habilitamos "Gmail API".
- Crear credenciales de "IDs de cliente de OAuth 2.0" y en el campo "URIs de redirección autorizados" añadir "https://developers.google.com/oauthplayground".
- Acceder a https://developers.google.com/oauthplayground y en el menú derecho seleccionar "Use your own OAuth2.0 credentials."
y añadir el "OAuth Client Id" y el "OAuth Client Secret".
- En el menú izquierdo añadir "https://mail.google.com/" en el campo del step 1 y seleccionar autorize api.
- Compiamos el accessToken y el refreshToken en la configuración del correo.






5) Ejecutar la instancia de la base de datos
```
        $ mongod
```
6) Ejecutar el programa
```
        $ sudo node server
```





##  Configuración de las estrategias sociales en Passport



## Creación de las aplicaciones
Antes de usar las estrategias sociales del package PassportJS para identificarte a través de Facebook y Google debes registrar una aplicación en dichas redes sociales. Si todavía no lo has hecho, las nuevas aplicaciones pueden ser creadas en los paneles de [Facebook for Developers](https://developers.facebook.com/) y  [Google Developers](https://developers.google.com/). Tus aplicaciones te proporcionarán una id de cliente (Client id) y un secreto (client secret).


# Configuración de las estratégias

Las estrategias de autenticación de usuarios de Facebook(passport-facebook) y Google(passport-google-oauth) utilizan tokens OAuth2.0.
A parte también utilizan los datos que tus aplicaciones te proporcionarán:

<ul>
<li>Una id de cliente (clientID)</li>
<li>Un secreto (clientSecret).</li>
<li>Una ruta callback que recive el token de acceso (callbackURL).</li>
</ul>

10) Se deben substituir los parámetros correspondientes en el fichero de configuración condif.js situado en /config/.

```
var ids = {
    'facebook': {
        'clientID': 'write here your facebook application client id',
        'clientSecret': 'write here your facebook application client secret',
        //modificar localhost por el dominio
        'callbackURL': 'write here your facebook application callback url'
    },
    'google':{
            'clientID': 'write here your google application client id',
	    'clientSecret': 'write here your google application client secret',
	    'callbackURL': 'write here your google application callback url'
    },
    'server':{
        'port': write a valid port
    },
    'db':{
        'url' : 'write here the url to access to the database',
	    'secret': 'write here a password for your session'
    },
    'email':{
        'user': 'escriba su correo ',
        'pass': 'escriba su contraseña de correo'
    }
};
```

11)Iniciar servidor Nginx
```
        systemctl service start nginx
```
12) Arrancar la aplicación con forever y comprovar de que se está ejecutando

```
        forever node server.js
```

# Configuración



# Estructura



# Packages


| Package                         | Descripción                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| async                           | Librería que permite flujos de control asíncronos.                    |
| crypto                          | Librería para aplicar un hash y un salt a las contraseñas.            |
| connect-mongo                   | Almacenaje de las sesiones MongoDB para el Framework Express.         |
| express                         | Framework web para Node.js web framework.                             |
| body-parser                     | Middleware de Express 4 obtener datos de los métodos HTTP.            |
| express-session                 | Express 4 middleware.                                                 |
| morgan                          | Express 4 middleware.                                                 |
| compression                     | Express 4 middleware.                                                 |
| errorhandler                    | Express 4 middleware.                                                 |
| serve-favicon                   | Express 4 middleware offering favicon serving and caching.            |
| express-flash                   | Provides flash messages for Express.                                  |
| express-status-monitor          | Reports real-time server metrics for Express.                         |
| express-validator               | Easy form validation for Express.                                     |
| fbgraph                         | Facebook Graph API library.                                           |
| github                          | GitHub API library.                                                   |
| pug (jade)                      | Template engine for Express.                                          |
| lastfm                          | Last.fm API library.                                                  |
| instagram-node                  | Instagram API library.                                                |
| lob                             | Lob API library                                                       |
| lusca                           | CSRF middleware.                                                      |
| mongoose                        | MongoDB ODM.                                                          |
| node-foursquare                 | Foursquare API library.                                               |
| node-linkedin                   | LinkedIn API library.                                                 |
| node-sass-middleware            | Sass middleware compiler.                                                 |
| nodemailer                      | Node.js library for sending emails.                                   |
| passport                        | Simple and elegant authentication library for node.js                 |
| passport-facebook               | Sign-in with Facebook plugin.                                         |
| passport-github                 | Sign-in with GitHub plugin.                                           |
| passport-google-oauth           | Sign-in with Google plugin.                                           |
| passport-twitter                | Sign-in with Twitter plugin.                                          |
| passport-instagram              | Sign-in with Instagram plugin.                                        |
| passport-local                  | Sign-in with Username and Password plugin.                            |
| passport-linkedin-oauth2        | Sign-in with LinkedIn plugin.                                         |
| passport-oauth                  | Allows you to set up your own OAuth 1.0a and OAuth 2.0 strategies.    |
| paypal-rest-sdk                 | PayPal APIs library.                                                  |
| request                         | Simplified HTTP request library.                                      |
| stripe                          | Offical Stripe API library.                                           |
| tumblr.js                       | Tumblr API library.                                                   |
| twilio                          | Twilio API library.                                                   |
| twit                            | Twitter API library.                                                  |
| lodash                          | Handy JavaScript utlities library.                                    |
| validator                       | Used in conjunction with express-validator in **controllers/api.js**. |
| mocha                           | Test framework.                                                       |
| chai                            | BDD/TDD assertion library.                                            |
| supertest                       | HTTP assertion library.                                               |


# Soporte


Existe una wiki disponible del proyecto en:[wiki](https://gitlab.iiia.csic.es/education-tfgs/auth/wikis/home).

# Licencia


Copyright (c) 2017 Antonia Retamal
