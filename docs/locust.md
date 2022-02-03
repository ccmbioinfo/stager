# [Locust](https://locust.io/) for application load testing

Locust is a framework for load testing in Python. Locust also supports distributed load testing, where multiple workers can be created on multiple cores on a single machine or multiple machines, therefore allowing for several users and requests to be simulated simultaneously.

## Setting up in a virtualenv

First, you will need Python 3.9, pip, and virtualenv. To create a virtualenv,
switch to the `locust` directory and run one of the following commands,
depending on how your Python installation is set up.

A virtualenv changes your PATH so Python modules resolve to dependencies
installed in this virtual environment, which helps keep projects separated
instead of polluting your global site packages.

```bash
virtualenv venv
# if the above doesn't work
python3 -m virtualenv
```

Then install dependencies through pip in the virtualenv.

```bash
. venv/bin/activate  # Activates the virtualenv. Run in a shell before dev work
pip3 install -r requirements.txt
```

## Launching Locust

To launch Locust, run the following command in the `locust` folder.

```bash
USERNAME=<username> PASSWORD=<password> python3 launch.py
```

Alternatively, you can create a local `.env` by copy-pasting the `sample.env` file and filling in approprivate credentials and run:

```bash
python3 launch.py
```

In Stager, Locust is set up to automatically run in distributed mode with one master node and multiple workers on a single machine. The number of workers equal the number of cores on your machine minus 2. One of the remaining two cores is dedicated for the master node, and the other one is left empty to avoid system freezes.

To run Locust in non-distributed mode, you can pass in the `workers` argument in your launch command:

```
python3 launch.py --workers=0
```

## Simulating users and viewing statistics

The master instance runs Locust’s web interface, and tells the workers when to spawn/stop Users. The workers run your Users and send back statistics to the master. The master instance doesn’t run any Users itself.

To view the statistics retrieved by the master instance, you can visit `http://localhost:8089`. The web interface will require you to enter the host domain for load testing, the number users you want to simulate, and the hatch rate of users.
