# Setup

## Nginx Fossil

Add to */etc/nginx/sites-enabled/default*:

```
    location /fossil/ {
        if ($http_user_agent ~ (YandexBot|PetalBot|bingbot) ) {
           return 403;
        }
        include scgi_params;
        scgi_pass 127.0.0.1:9000;
        scgi_param SCRIPT_NAME "/fossil";
        #scgi_param HTTPS "on";
    
    }
```

Create startup script */etc/init.d/fossil*:
```
    #! /bin/sh
    
    ### BEGIN INIT INFO
    # Provides:          fossil
    # Required-Start:    $local_fs $remote_fs
    # Required-Stop:
    # X-Start-Before:    rmnologin
    # Default-Start:     2 3 4 5
    # Default-Stop:
    # Short-Description: Provide fossil
    # Description: Provide fossil
    ### END INIT INFO
    
    . /lib/lsb/init-functions
    
    N=/etc/init.d/fossil
    
    set -e
    
    case "$1" in
      start)
        # make sure privileges don't persist across reboots
        /sbin/runuser www-data -s /bin/bash -c "/usr/local/bin/fossil server /var/www/fossil/ --scgi --localhost --port 9000 --repolist" &
        ;;
      stop|reload|restart|force-reload|status)
        killall fossil
        ;;
      *)
        echo "Usage: $N {start|stop|restart|force-reload|status}" >&2
        exit 1
        ;;
    esac
    
    exit 0
```

Then:
```
    chmod u+x /etc/init.d/fossil
    /etc/init.d/fossil start
```

## Geany

On Ubuntu, install geany with:

```
    sudo apt update && sudo apt install geany geany-plugins
```

In *Tools/Plugin-Manager* enable: **Addons**, **Auto-Close**, **Extra Selection**,
**File-Browser**, **Lua-Script**, **Overview**, **Split-Window**.

Then in *Edit/Plugin-Preferences/File Browser*, check **Follow the path of current file**.

### Syntax

You can improve .vue/.vue.js file appearance.


*Tools/Configuration Files/filetype_extensions.conf*: 

 - Append to **HTML=**
```
    .vue;
```

*Tools/Configuration Files/Filetype Configuration/Markup Language/filetypes.html*: 

 - Insert after **html=**
```
    ^b- ^v-
```

 - Insert after **javascript=**
```
    ^this.
```

### Dark Background

Ubuntu fans of dark background can use:

```
cp /etc/gtk-3.0/settings.ini ~/.config/gtk-3.0/
echo 'gtk-application-prefer-dark-theme=1' >> ~/.config/gtk-3.0/settings.ini
```
Then go to *Edit/Preferences/Editor/Display*
and toggle-on **Invert syntax highlight colors**.
Or you can download dark color schemes.

### JS Symbol Navigation

On Geany version 1.36+, Vue methods show up in the symbol navigation when written as:

```
    methods:{ foo:function foo(){}, bar:function bar(){}, ...}
```

You can use this regex Search/Replace in geany to rewrite **name:function()**:

```
    \b([\$a-zA-Z0-9_]+)\:\s*function\(
    \1:function \1(
```


## Fossil Publish Workflow

Do changes in a private checkout, then on final commit:

In pdq trunk
- fossil merge --integrate private
- fossil commit -m msg

In pdq private
- fossil update trunk
- fossil commit -m To-private --private --allow-empty
