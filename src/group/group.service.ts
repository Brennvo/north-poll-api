import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateGroupDTO } from './dto/create-group.dto';
import { Group } from 'src/entities/group.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UpdateGroupDTO } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  async createGroup(createGroupDto: CreateGroupDTO): Promise<Group> {
    const { userId, groupName, voteEndDt, participants } = createGroupDto;
    const group = new Group();
    group.groupName = groupName;
    // TODO: Update owner to user attached to req.body from Passport
    group.ownerId = userId;
    group.voteEndDt = new Date(voteEndDt);
    const userParticipants = await User.findByIds([userId, ...participants]);

    group.participants = userParticipants;

    const newGroup = await group.save();
    return newGroup;
  }

  async updateGroup(
    groupId: number,
    updateGroupDto: UpdateGroupDTO,
  ): Promise<Group> {
    const { groupName, voteEndDt, participants, ownerId } = updateGroupDto;

    const foundGroup = await Group.findOne(groupId);

    console.log('found group owner: ', foundGroup.ownerId);
    console.log('USER ID IN REQ: ', ownerId);
    if (foundGroup.ownerId != ownerId) {
      throw new UnauthorizedException();
    }

    if (!foundGroup) {
      throw new NotFoundException(`Group with ID ${groupId} not found.`);
    }

    if (groupName) {
      foundGroup.groupName = groupName;
    }

    if (voteEndDt) {
      foundGroup.voteEndDt = voteEndDt;
    }

    if (participants) {
      const updatedParticipants = await User.findByIds([
        foundGroup.ownerId,
        ...participants,
      ]);
      foundGroup.participants = updatedParticipants;
    }

    return await foundGroup.save();
  }
}
