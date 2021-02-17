# README

[PDQ Home](https://jsish.org/fossil/pdq)

[Setup Docs](./md/Setup.md)

## Installation

Get Fossil and Jsish:
```
    wget http://jsish.org/bin/fossil
    wget http://jsish.org/bin/jsish
    sudo install jsish fossil /usr/local/bin/
```

Now create your first child project:
```
    mkdir mypdq && cd $_ && jsish -m sclone && jsish .
```


Futures updates are available using:
```
    jsish -m supdate
```

Setup on a remote server via SSH:
```
    fossil user passw $USER
    jsish -m sunzip
    scp -r ../mypdq myserver.com:
    fossil remote ssh://myserver.com/mypdq/mypdq.fossil
    fossil commit -m Test
```

Web Setup:
```
ssh myserver.com
sudo ln -s ~/mypdq /var/www/html/mypdq
```

Fossil Update
---

Do a manual update using ssh with:
```
ssh myserver.com 'cd myproj && fossil update'
```

Or automate using **crontab -e** to add a line like the following:
```
0,15,30,45 * * * * cd ~/mypdq && /usr/local/bin/fossil update
```
which grab changes every 15 minutes.

## Partial

- Plugins: Loading, Import-Add, Remove, Disable, Export.
- Repos: Add, Remove, Commit, Export, Push, Pull.

## Todo
- Finish Main UI: Search, Person-avatar, 
- MD doc viewer make links work inside vue-router.
- Make hamburger menu more than just mirror of side menu.
- Add config cog to apps
- Fossil integration using threads?

## Done
- Unversioned: not practical with ssh/disk 

