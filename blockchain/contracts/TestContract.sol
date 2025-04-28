// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract TestContract {
	string public message;
	event MessageUpdated(string newMessage);

	constructor() {
		message = "Hello Blockchain";
	}

	function setMessage(string memory newMessage) public {
		message = newMessage;
		emit MessageUpdated(newMessage);
	}
}
