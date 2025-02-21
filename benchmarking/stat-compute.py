
import re
import numpy as np
import argparse
import os
import chardet


LOG = "chord.txt"
logfile = os.path.join(os.path.dirname(__file__), LOG)

# Read log data from the specified file
with open(logfile, 'rb') as file:
    rd = file.read()
    enc = chardet.detect(rd)["encoding"]

with open(logfile, 'r', encoding=enc) as file:
    log_data = file.read()

# Regular expressions to extract numbers
client_times = [float(match.group(1)) for match in re.finditer(r"Client time: ([\d\.]+) ms", log_data)]
server_times = [float(match.group(1)) for match in re.finditer(r"Server time: ([\d\.]+) ms", log_data)]

total_times = [c + s for c, s in zip(client_times, server_times)]

# Compute statistics
def compute_stats(times):
    return {
        "count": len(times),
        "average": np.mean(times) if times else None,
        "std_dev": np.std(times, ddof=1) if len(times) > 1 else None
    }

client_stats = compute_stats(client_times)
server_stats = compute_stats(server_times)
total_stats = compute_stats(total_times)

# Print results
print("Client Time Statistics:", client_stats)
print("Server Time Statistics:", server_stats)
print("Total Time Statistics:", total_stats)