import argparse
import multiprocessing
import subprocess
from typing import List, Union

SOLO_LAUNCH_CMD = "locust -f locustfile.py"
active_processes: List["subprocess.Popen[bytes]"] = []


def WorkerCount(arg) -> int:
    try:
        v = int(arg)
    except ValueError:
        raise argparse.ArgumentTypeError("Arg should be a valid int")

    if v < 0:
        raise argparse.ArgumentTypeError("Arg must be greater than 0")

    return v


def get_launch_cmd(is_master=False):
    return f"locust -f locustfile.py --{'master' if is_master else 'worker'}"


def run_master_node(is_distributed=True):
    master_node = subprocess.Popen(
        get_launch_cmd(is_master=True) if is_distributed else SOLO_LAUNCH_CMD
    )
    print(f"Master node running with pid = {master_node.pid}")
    active_processes.append(master_node)


def run_worker_nodes(worker_count):
    for _ in range(worker_count):
        worker = subprocess.Popen(get_launch_cmd())
        print(f"Worker node running with pid = {worker.pid}")
        active_processes.append(worker)


def main(worker_count: Union[int, None] = None):
    active_processes.clear()
    run_master_node()
    # leave one thread to avoid system freezes | 1 already used by master node
    max_workers = multiprocessing.cpu_count() - 2
    usable_workers = (
        min(worker_count, max_workers) if worker_count is not None else max_workers
    )

    run_worker_nodes(usable_workers)

    while True:
        usr_cmd = input('Enter "q" to exit').rstrip("\n")
        if usr_cmd == "q":
            for process in active_processes:
                process.kill()
            break


if __name__ == "__main__":
    argparser = argparse.ArgumentParser(
        description="Launch locust load tester in distributed mode"
    )

    argparser.add_argument(
        "--workers",
        type=WorkerCount,
        default=None,
        help="Number of workers for the load test. Setting this to 0 launches locust in non-distributed mode",
    )

    args = argparser.parse_args()
    main(args.workers)
