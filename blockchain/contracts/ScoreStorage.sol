// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract ScoreStorage {
	struct Match {
		string playerA;
		string playerB;
		uint8 scoreA;
		uint8 scoreB;
		string winner;
		uint256 timestamp;
	}

	mapping (uint256 => Match) public matches;
	uint256 public matchCount;

	event MatchStored(
		uint256 indexed matchId,
		string playerA,
		string playerB,
		uint8 scoreA,
		uint8 scoreB,
		string winner,
		uint256 timestamp
	);

	function storeMatch(string memory playerA, string memory playerB, uint8 scoreA, uint8 scoreB, string memory winner, uint256 timestamp) public returns (uint256) {
		matchCount++;
		matches[matchCount] = Match(playerA, playerB, scoreA, scoreB, winner, timestamp);
		emit MatchStored(matchCount, playerA, playerB, scoreA, scoreB, winner, timestamp);
		return matchCount;
	}

	function getMatch(uint256 matchId) public view returns (string memory playerA, string memory playerB, uint8 scoreA, uint8 scoreB, string memory winner, uint256 timestamp) {
		Match memory m = matches[matchId];
		return (m.playerA, m.playerB, m.scoreA, m.scoreB, m.winner, m.timestamp);
	}

	function getMatchCount() public view returns (uint256) {
		return matchCount;
	}
}
