# README

NOTE: this project is no longer fossil-hosted on jsish.org

[PDQ](https://github.com/pcmacdon/pdq) 
is a early-stage draft project to use Jsi and Fossil to providing CMS like functionality.

**NOTE**: currently works under native Linux, but not Windows nor WSL.

PDQ is modelled loosely after Wordpress, but is standalone and stores it's data
within it's own fossil repository and thus can be decentralized.

To start we clone PDQ to a child project:
```
    mkdir mypdq && cd $_ && jsish -m sclone
```

Then run it with:

```
    jsish .
```
This should open a web browser at the GUI, which you should note is currently not yet complete.

PDQ Plugins come from a separate repos [Plugin](https://github.com/pcmacdon/pdq-plugins).

## Updating

To updates PDQ we use:
```
    jsish -m supdate
```

## Installation

### Getting Fossil and Jsish:
Get fossil from https://fossil-scm.org/home/uv/download.html
and jsish from http://github.com/pcmacdon/jsibin, then

```
    sudo install jsish fossil /usr/local/bin/
```


### Setup on a remote server via SSH:
```
    fossil user passw $USER
    jsish -m sunzip
    scp -r ../mypdq myserver.com:
    fossil remote ssh://myserver.com/mypdq/mypdq.fossil
    fossil commit -m Test
```

### Web Setup:
```
ssh myserver.com
sudo ln -s ~/mypdq /var/www/html/mypdq
```
[Setup Docs](./md/Setup.md)


### Fossil Update

Do a manual update using ssh with:
```
ssh myserver.com 'cd myproj && fossil update'
```

Or automate using **crontab -e** to add a line like the following:
```
0,15,30,45 * * * * cd ~/mypdq && /usr/local/bin/fossil update
```
which grab changes every 15 minutes.

## Staus

### Implemented

- Plugins: Loading, Import-Add, Remove, Disable, Export.
- Repos: Add, Remove, Commit, Export, Push, Pull.

### Todo
- Finish Main UI: Search, Person-avatar, 
- MD doc viewer make links work inside vue-router.
- Make hamburger menu more than just mirror of side menu.
- Add config cog to apps
- Fossil integration using threads?

### Never
- Unversioned: not practical with ssh/disk 


