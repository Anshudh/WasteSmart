// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WasteBadge is ERC721URIStorage, Ownable {
    uint256 private _nextId;

    event BadgeMinted(address indexed to, uint256 indexed tokenId, string uri);

    constructor() ERC721("WasteBadge", "WBADGE") Ownable(msg.sender) {
        _nextId = 1;
    }

    function mintBadge(address to, string calldata tokenURI)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 id = _nextId;
        _safeMint(to, id);
        _setTokenURI(id, tokenURI);
        _nextId++;
        emit BadgeMinted(to, id, tokenURI);
        return id;
    }
}
