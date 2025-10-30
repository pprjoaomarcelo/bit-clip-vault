// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Mailbox {

    event MessageSent(
        address indexed sender,
        address indexed recipient,
        string cid
    );

    function sendMessage(address _recipient, string calldata _cid) public {
        require(_recipient != address(0), "Mailbox: Destinatario nao pode ser o endereco zero.");
        require(bytes(_cid).length > 0, "Mailbox: CID nao pode ser vazio.");

        emit MessageSent(msg.sender, _recipient, _cid);
    }
}