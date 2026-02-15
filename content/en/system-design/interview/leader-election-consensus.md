---
title: "Leader Election and Consensus Algorithms"
date: 2025-02-15
tags: ["system-design", "leader-election", "consensus", "raft", "paxos"]
description: "Comprehensive guide to leader election and consensus algorithms in distributed systems."
author: "Eric Nguyen"
layout: "post"
---

# Leader Election and Consensus

## Why Leader Election and Consensus Matter?

In distributed systems, we need to:

- **Maintain consistency**: All nodes agree on state
- **Achieve availability**: System continues operating during failures
- **Prevent conflicts**: Only one leader at a time
- **Recover from failures**: Elect new leader when needed

---

## Leader Election

### What is Leader Election?

Process by which nodes in a distributed system select one node as the leader.

### Requirements

- **Safety**: At most one leader at a time
- **Liveness**: System eventually elects a leader when needed
- **Fairness**: All nodes have chance to be leader
- **Fault tolerance**: Works despite node failures

---

## Bull's Algorithm

### Algorithm Steps

```
1. Election Phase:
   - Each node has unique ID
   - Nodes send their IDs to all other nodes
   - Node with highest ID becomes leader

2. Normal Operation:
   - Leader sends heartbeats to all followers
   - Followers acknowledge heartbeats
   - If leader fails, new election starts
```

### Implementation

```python
import time
import socket
import threading

class BullAlgorithm:
    def __init__(self, node_id: str, peers: list):
        self.node_id = node_id
        self.peers = peers
        self.leader_id = None
        self.is_running = True
        self.election_timeout = 10  # seconds
        self.heartbeat_interval = 2  # seconds
        self.state = 'follower'

    def start(self):
        while self.is_running:
            if self.state == 'follower':
                self.start_election()
            else:
                self.send_heartbeats()
            time.sleep(self.heartbeat_interval)

    def start_election(self):
        print(f"Starting election for node {self.node_id}")
        self.state = 'candidate'
        self.leader_id = self.node_id
        self.votes_received = {self.node_id}

        # Request votes from all peers
        for peer in self.peers:
            try:
                self.send_vote_request(peer)
            except Exception as e:
                print(f"Failed to send vote request to {peer}: {e}")

        # Wait for votes
        time.sleep(self.election_timeout)

        # Count votes
        if len(self.votes_received) > len(self.peers) / 2:
            self.state = 'leader'
            print(f"Node {self.node_id} elected as leader!")
        else:
            # Check if anyone else became leader
            self.state = 'follower'
            self.votes_received.clear()

    def send_vote_request(self, peer: str):
        # Send election message with node ID
        message = {
            'type': 'election',
            'candidate_id': self.node_id
        }
        self.send_message(peer, message)

    def process_vote_request(self, message: dict):
        candidate_id = message['candidate_id']

        # Vote for candidate with higher ID
        if candidate_id > int(self.node_id):
            # Vote for this candidate
            self.send_message(message['sender'], {
                'type': 'vote',
                'candidate_id': candidate_id,
                'voter_id': self.node_id
            })
        else:
            # Vote for self
            self.send_message(message['sender'], {
                'type': 'vote',
                'candidate_id': self.node_id,
                'voter_id': self.node_id
            })

    def process_vote(self, message: dict):
        candidate_id = message['candidate_id']
        voter_id = message['voter_id']

        if self.state == 'candidate':
            self.votes_received[voter_id] = candidate_id

            # Check if we won
            if len(self.votes_received) > len(self.peers) / 2:
                self.state = 'leader'
                self.leader_id = self.node_id

    def send_heartbeats(self):
        if self.state == 'leader':
            for peer in self.peers:
                self.send_message(peer, {
                    'type': 'heartbeat',
                    'leader_id': self.node_id,
                    'timestamp': time.time()
                })

    def process_heartbeat(self, message: dict):
        leader_id = message['leader_id']
        timestamp = message['timestamp']

        if self.state == 'follower':
            self.leader_id = leader_id
            print(f"Following leader {leader_id}")
        else:
            # Check if leader timeout
            if time.time() - timestamp > self.election_timeout * 3:
                print(f"Leader {leader_id} timed out, starting election")
                self.start_election()

    def send_message(self, peer: str, message: dict):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((peer, 5000))
                s.sendall(json.dumps(message).encode())
        except Exception as e:
            print(f"Failed to send message to {peer}: {e}")

# Usage
peers = ['node1:5001', 'node2:5002', 'node3:5003']
node = BullAlgorithm('node2:5002', peers)
node.start()
```

---

## Raft Consensus Algorithm

### What is Raft?

Raft is a consensus algorithm designed for managing a replicated log across multiple servers.

### Core Concepts

**1. States:**

- **Follower**: Replicates leader's log
- **Candidate**: Campaigning to become leader
- **Leader**: Handles all client requests

**2. Terms:**

- Current term number (increases with elections)
- Log index and term

**3. Properties:**

- **Election Safety**: At most one leader per term
- **Log Matching**: If logs contain same entries at same index, they're identical
- **Leader Completeness**: If log entry is committed, it will be available in future leader logs

### Raft Algorithm Steps

**1. Leader Election (Candidate State):**

```
- Increment current term
- Vote for self
- If majority votes → Become leader
- If receive higher term → Step down to follower
```

**2. Log Replication (Leader State):**

```
- Receive client request
- Append to log
- Replicate to majority of followers
- Commit after majority acknowledge
- Apply to state machine
- Respond to client
```

**3. Log Replication (Follower State):**

```
- Receive AppendEntries RPC from leader
- If term < current term, respond with own log info
- If log contains new entries, append to local log
- Commit entries that have been committed by leader
```

### Implementation (Simplified)

```python
from enum import Enum
import time
import threading
import socket

class RaftState(Enum):
    FOLLOWER = "FOLLOWER"
    CANDIDATE = "CODE"
    LEADER = "LEADER"

class RaftNode:
    def __init__(self, node_id: str, peers: list):
        self.node_id = node_id
        self.peers = peers
        self.current_term = 0
        self.voted_for = {}
        self.log = []  # List of (term, index, command)
        self.commit_index = -1
        self.state = RaftFOLLOWER
        self.last_heartbeat = time.time()
        self.election_timeout = 5  # seconds
        self.heartbeat_interval = 2  # seconds
        self.running = True

    def start(self):
        while self.running:
            try:
                if self.state == RaftFOLLOWER:
                    self.follower_loop()
                elif self.state == RaftCANDID:
                    self.candidate_loop()
                elif self.state == RaftLEADER:
                    self.leader_loop()
                time.sleep(0.1)
            except KeyboardInterrupt:
                self.running = False
                break

    def follower_loop(self):
        # Check for leader heartbeat
        if time.time() - self.last_heartbeat > self.election_timeout * 3:
            print(f"Leader timeout, starting election")
            self.start_election()

    def start_election(self):
        print(f"Starting election for term {self.current_term + 1}")
        self.current_term += 1
        self.voted_for[self.current_term] = self.node_id
        self.state = RaftCANDIDE

        # Request votes from all peers
        self.request_votes()

        # Wait for votes or timeout
        time.sleep(self.election_timeout)

        # Check if won
        if self.won_election():
            self.state = RaftLEADER
            print(f"Became leader for term {self.current_term}")
        else:
            self.state = RaftFOLLOWER
            print(f"Lost election for term {self.current_term}")

    def request_votes(self):
        print(f"Requesting votes for term {self.current_term}")
        for peer in self.peers:
            self.send_request_vote_rpc(peer, self.current_term, self.node_id)

    def send_request_vote_rpc(self, peer: str, term: int, candidate_id: str):
        message = {
            'type': 'RequestVote',
            'term': term,
            'candidate_id': candidate_id,
        }
        self.send_message(peer, message)

    def process_request_vote(self, message: dict):
        term = message['term']
        candidate_id = message['candidate_id']

        if term < self.current_term:
            # Vote for candidate (their term is old)
            self.send_response_vote(message['sender'], term, self.node_id)
        elif term > self.current_term:
            # Reject (candidate has higher term)
            print(f"Received higher term {term}, rejecting")
        elif candidate_id < self.node_id:
            # Vote for candidate with higher ID
            self.send_response_vote(message['sender'], term, self.node_id)
        # Else, don't vote (wait for higher candidate)

    def send_response_vote(self, peer: str, term: int, candidate_id: str):
        message = {
            'type': 'ResponseVote',
            'term': term,
            'candidate_id': candidate_id,
            'voter_id': self.node_id
        }
        self.send_message(peer, message)

    def process_response_vote(self, message: dict):
        term = message['term']
        voter_id = message['voter_id']

        if self.state == RaftCANDID:
            self.voted_for[term][voter_id] = candidate_id
            print(f"Received vote from {voter_id} for {candidate_id}")

            # Check if we have majority
            if self.won_election():
                self.state = RaftLEADER
                print(f"Received majority, becoming leader")

    def won_election(self):
        votes = self.voted_for.get(self.current_term, {})
        return len(votes) > len(self.peers) / 2

    def leader_loop(self):
        # Send heartbeats to followers
        self.send_heartbeats()

        # Process client requests (not implemented in this example)
        time.sleep(self.heartbeat_interval)

    def send_heartbeats(self):
        for peer in self.peers:
            self.send_append_entries_rpc(peer)

    def send_append_entries_rpc(self, peer: str):
        message = {
            'type': 'AppendEntries',
            'term': self.current_term,
            'leader_id': self.node_id,
            'commit_index': self.commit_index,
            'entries': self.log[:self.commit_index + 1] if self.log else []
        }
        self.send_message(peer, message)

    def process_append_entries(self, message: dict):
        term = message['term']
        leader_id = message['leader_id']
        commit_index = message['commit_index']
        entries = message['entries']

        if term > self.current_term:
            # Leader has higher term, step down
            self.current_term = term
            print(f"Received higher term {term}, updating")
            return

        if self.state == RaftLEADER and leader_id != self.node_id:
            # New leader detected
            print(f"New leader detected: {leader_id}")
            self.state = RaftFOLLOWER
            return

        # Append entries if we're behind
        if len(entries) > 0:
            for entry in entries:
                self.log.append(entry)
            self.commit_index = len(self.log) - 1
            print(f"Appended {len(entries)} entries, commit_index: {self.commit_index}")

        # Respond
        response = {
            'type': 'AppendEntriesResponse',
            'term': self.current_term,
            'success': True,
            'commit_index': self.commit_index
        }
        self.send_message(message['sender'], response)

    def send_message(self, peer: str, message: dict):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((peer, 5000))
                s.sendall(json.dumps(message).encode())
        except Exception as e:
            print(f"Failed to send message to {peer}: {e}")

# Usage
peers = ['node1:5001', 'node2:5002', 'node3:5003']
node = RaftNode('node2:5002', peers)
# node.start()
```

---

## ZooKeeper

### What is ZooKeeper?

ZooKeeper is a centralized service for maintaining configuration information, naming, providing distributed synchronization, and providing group services.

### ZNode Structure

```
/ (root)
├── /apps
│   └── /myapp
│       ├── /config
│       └── /leader
└── /services
    └── /myservice
        ├── /instance1
        ├── /instance2
        └── /instance3
```

### Leader Election in ZooKeeper

```python
from kazoo.client import KazooClient
from kazoo.exceptions import NodeExistsError
import time

class ZooKeeperLeaderElection:
    def __init__(self, zookeeper_hosts: list, election_path: str, node_id: str):
        self.zk = KazooClient(hosts=zookeeper_hosts)
        self.election_path = election_path
        self.node_id = node_id
        self.leader_path = f"{election_path}/leader"
        self.current_leader = None
        self.is_running = True

    def start(self):
        self.zk.start()

        try:
            # Create ephemeral node for leader
            self.zk.create(self.leader_path, self.node_id.encode())
            print(f"Created leader node: {self.node_id}")

            # Watch for leader changes
            while self.is_running:
                try:
                    # Get current leader
                    leader_data = self.zk.get(self.leader_path)
                    if leader_data:
                        self.current_leader = leader_data.decode()
                        print(f"Current leader: {self.current_leader}")

                    # Watch for changes
                    @self.zk.ChildrenWatch(self.election_path)
                    def watch_event(changes):
                        # Process children changes
                        pass

                    self.zk.get_children_async(self.election_path, watch=watch_event)

                    time.sleep(5)

                except Exception as e:
                    print(f"Lost connection to ZooKeeper: {e}")
                    time.sleep(5)

        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        self.is_running = False
        try:
            self.zk.stop()
            self.zk.close()
        except:
            pass

    def is_leader(self):
        return self.current_leader == self.node_id

# Usage
election = ZooKeeperLeaderElection(
    zookeeper_hosts=['zk1:2181', 'zk2:2181', 'zk3:2181'],
    election_path='/myapp/leader',
    node_id='node2'
)
election.start()
```

---

## etcd

### What is etcd?

etcd is a distributed, reliable key-value store for the most critical data of a distributed system.

### etcd Key Structure

```
/myapp
├── /config
├── /leader
└── /members
    ├── node1
    ├── node2
    └── node3
```

### Leader Election with etcd

```python
import etcd3

class EtcdLeaderElection:
    def __init__(self, etcd_endpoints: list, election_key: str, node_id: str, ttl: int = 30):
        self.etcd = etcd3.client(etcd_endpoints)
        self.election_key = election_key
        self.node_id = node_id
        self.lease_ttl = ttl
        self.is_running = True
        self.lease = None

    def start(self):
        while self.is_running:
            try:
                # Try to acquire lease
                self.lease = self.etcd.lease.acquire(
                    self.election_key,
                    self.node_id.encode(),
                    ttl=self.lease_ttl
                )

                if self.lease:
                    print(f"{self.node_id} became leader")
                    self.run_as_leader()
                else:
                    # Not leader, wait and retry
                    time.sleep(self.lease_ttl / 2)

            except Exception as e:
                print(f"etcd error: {e}")
                time.sleep(5)

    def run_as_leader(self):
        try:
            while True:
                # Keep renewing lease
                self.lease.refresh(self.lease_ttl / 2)

                # Do leader work here
                time.sleep(self.lease_ttl / 4)

        except Exception as e:
            print(f"Lost leadership: {e}")
            self.start()

    def stop(self):
        self.is_running = False
        if self.lease:
            self.lease.revoke()
        try:
            self.etcd.close()
        except:
            pass

    def is_leader(self):
        if not self.lease:
            return False
        # Check if we still own the lease
        try:
            lease_info = self.etcd.get_lease_info(self.election_key)
            self.is_leader = lease_info and lease_info['ID'] == self.node_id
        except Exception:
            return False

        return self.is_leader

# Usage
election = EtcdLeaderElection(
    etcd_endpoints=['http://etcd1:2379', 'http://etcd2:2379', 'http://etcd3:2379'],
    election_key='/myapp/leader',
    node_id='node2',
    ttl=30
)
election.start()
```

---

## Paxos

### What is Paxos?

Paxos is a family of protocols for achieving consensus in a network of unreliable processors.

### Paxos Roles

**1. Proposer:**

- Proposes values to acceptors
- Collects and decides on outcome

**2. Acceptor:**

- Accepts or rejects proposals
- Makes promises to proposers

**3. Learner:**

- Learns chosen value
- Implements the result

### Paxos Promise

A promise is an acceptor's commitment not to accept any proposal numbered less than the one promised.

```python
class PaxosPromise:
    def __init__(self, proposal_number: int, proposer_id: str, promised_to: str):
        self.proposal_number = proposal_number
        self.proposer_id = proposer_id
        self.promised_to = promised_to
```

### Basic Paxos Implementation

```python
import time
import threading

class PaxosNode:
    def __ins__(self, node_id: str, peers: list):
        self.node_id = node_id
        self.peers = peers
        self.proposal_number = 0
        self.accepted_value = None
        self.promises = {}  # proposer_id -> list of promises
        self.is_running = True

    def start_proposer(self, value):
        """Propose a value to peers"""
        print(f"Proposing value: {value}")
        self.proposal_number += 1
        self.promises = {}  # Reset promises

        # Send proposal to all peers
        for peer in self.peers:
            self.send_proposal(peer, self.proposal_number, value)

        # Wait for responses
        time.sleep(5)

        # Check if majority accepted
        if self.has_majority_acceptance():
            self.accepted_value = value
            print(f"Value {value} accepted by majority")
        else:
            print("Value not accepted")

    def send_proposal(self, peer: str, proposal_number: int, value):
        message = {
            'type': 'proposal',
            'proposal_number': proposal_number,
            'proposer_id': self.node_id,
            'value': value
        }
        self.send_message(peer, message)

    def process_proposal(self, message: dict):
        proposal_number = message['proposal_number']
        proposer_id = message['proposer_id']
        value = message['value']

        if proposal_number < self.proposal_number:
            # Reject old proposal
            response = {
                'type': 'reject',
                'proposal_number': proposal_number,
                'acceptor_id': self.node_id,
                'reason': 'old_proposal'
            }
        else:
            # Accept proposal
            response = {
                'type': 'accept',
                'proposal_number': proposal_number,
                'acceptor_id': self.node_id
            }
            print(f"Accepted proposal {proposal_number} from {proposer_id}")

        self.send_message(proposer_id, response)

    def has_majority_acceptance(self) -> bool:
        accepted_count = len(self.promises.get(self.proposal_number, []))
        return accepted_count > len(self.peers) / 2

    def send_message(self, peer: str, message: dict):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.connect((peer, 5000))
                s.sendall(json.dumps(message).encode())
        except Exception as e:
            print(f"Failed to send message to {peer}: {e}")
```

---

## Consensus Comparison

| Algorithm     | Complexity | Throughput | Latency | Use Case                                        |
| ------------- | ---------- | ---------- | ------- | ----------------------------------------------- |
| **Bull**      | Low        | High       | Low     | Small clusters, simple systems                  |
| **Raft**      | Medium     | Medium     | Low     | General-purpose, log replication                |
| **ZooKeeper** | High       | Low        | Medium  | Configuration, leader election                  |
| **etcd**      | Medium     | High       | Low     | Configuration, key-value store, leader election |
| **Paxos**     | Very High  | Low        | High    | Critical systems requiring strong consistency   |

---

## Use Cases

### 1. Distributed Configuration Management

**ZooKeeper/etcd:**

```
Service Discovery:
├── Register service on startup
├── Leader election for coordinator
└── Service discovery for clients

Configuration Storage:
├── Store configuration in ZNodes
├── Watch for changes
└── Dynamic reload on change
```

### 2. Distributed Lock

```python
class DistributedLock:
    def __init__(self, zk_client, lock_path: str, node_id: str):
        self.zk = zk_client
        self.lock_path = lock_path
        self.node_id = node_id
        self.lock = None

    def acquire(self, timeout: int = 30) -> bool:
        try:
            self.lock = self.zk.Lock(
                self.lock_path,
                timeout=timeout
            )
            self.lock.acquire()
            return True
        except Exception as e:
            print(f"Failed to acquire lock: {e}")
            return False

    def release(self):
        if self.lock:
            self.lock.release()
            self.lock = None
        # Delete znode
            try:
                self.zk.delete(self.lock_path)
            except:
                pass
```

### 3. Master-Slave Failover

```
1. Master fails
2. Slaves detect failure via missed heartbeats
3. Slaves start leader election
4. New master elected
5. Slaves reconfigure to follow new master
```

### 4. Distributed Counter Coordination

```
Counter Coordinator:
├── Uses Raft for leader election
├── Leader assigns counter ID ranges
├── Each worker processes assigned range
└── Aggregates final count
```

---

## Monitoring

### Leader Election Metrics

```
Metrics:
- Election count per node
- Term changes per hour
- Leader tenure duration
- Vote success/failure rate
- Heartbeat latency

Alerts:
- Frequent elections (> 3/hour)
- Long election duration (> 60s)
- Multiple leaders detected
- Node failures
```

### Consensus Metrics

```
Metrics:
- Log replication lag
- Commit latency (P50, P95, P99)
- Failed transactions rate
- Network partition events
- Leader performance

Alerts:
- High replication lag (> 10s)
- Consensus failures
- Network partitions
- Leader overloaded
```

---

## Follow-up Questions

1. **How to handle network partitions?**
   - Raft: Nodes in minority partition can't commit
   - ZooKeeper/etcd: Continue serving requests from majority partition
   - Split brain prevention with fencing

2. **How to handle stale leaders?**
   - Leader steps down when detecting higher term
   - Nodes reject requests from old leaders
   - Timeouts and term comparisons

3. **How to scale consensus?**
   - Use sharding: Multiple consensus groups
   - Optimized Raft for large clusters
   - Separate hot data and cold data

4. **How to handle log compaction?**
   - Snapshot creation periodically
   - Remove old log entries
   - Compact and reindex

5. **How to handle configuration updates?**
   - Use ZooKeeper/etcd for configuration
   - Watch for configuration changes
   - Distributed reload on changes
   - Version control for rollback

---

## Links

- [System Design Interview Overview](overview.md)
- [Distributed Systems Fundamentals](distributed-systems.md)
- [Design Patterns](design-patterns.md)
- [Trade-offs in System Design](trade-offs.md)
