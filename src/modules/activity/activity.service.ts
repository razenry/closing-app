import { ActivityRepository, CreateActivityLogParams } from "./activity.repository";

export class ActivityService {
  static async log(params: CreateActivityLogParams) {
    return ActivityRepository.create(params);
  }

  static async getLogsForClosing(closingId: string) {
    return ActivityRepository.listByClosingId(closingId);
  }
}
