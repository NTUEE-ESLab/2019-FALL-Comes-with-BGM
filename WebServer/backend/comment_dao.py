import time


class Comment_DAO:

    def __init__(self):

        '''
        comment_info_by_comment_to:
            comment_info_by_comment_to[comment_to][comment_from] -> comment
        comment_info_by_comment_from:
            comment_info_by_comment_to[comment_from][comment_to] -> comment
        
        comment format:
           comment_to: account that this comment to
           comment_from: account that thist comment from
           time: this comment submit time, None if only save (timestamp)
           content: self-defined blank
           viewed: accounts (list) that has viewed this comment
           is_submit: True if this is submit, not save.
        '''
        
        self.comment_info_by_comment_to = {}
        self.comment_info_by_comment_from = {}

        # is_submit_by_comment_pair: (comment_from, comment_to)
        self.is_submit_by_comment_pair = set()

    def submit_or_save_comment(
                self, comment_from, comment_to,
                content, is_submit, time=time.time()):

        if comment_to not in self.comment_info_by_comment_to:
            self.comment_info_by_comment_to[comment_to] = {}
        if comment_from not in self.comment_info_by_comment_from:
            self.comment_info_by_comment_from[comment_from] = {}

        # add comment to comment_info_by_comment_to,
        #    which fields is described above.
        comment = {
            'comment_to': comment_to,
            'comment_from': comment_from,
            'time': time,
            'content': content,
            'viewed': [],
            'is_submit': is_submit
        }
        self.comment_info_by_comment_to[comment_to][comment_from] = comment
        self.comment_info_by_comment_from[comment_from][comment_to] = comment

        # if is submit, let comment_from know.
        if is_submit:
            self.is_submit_by_comment_pair.add((comment_from, comment_to))

    def is_submit(self, comment_from, comment_to):
        return (comment_from, comment_to) in self.is_submit_by_comment_pair

    def get_saved_content(self, comment_from, comment_to):
        if comment_to not in self.comment_info_by_comment_to \
                or comment_from not in \
                self.comment_info_by_comment_to[comment_to]:
            # comment not exist.
            return ""

        comment = self.comment_info_by_comment_to[comment_to][comment_from]

        if comment['is_submit']:
            # TODO: if is submit, return warning
            pass

        return comment['content']

    def get_number_of_comment(self, comment_to):
        if comment_to in self.comment_info_by_comment_to:
            return len(self.comment_info_by_comment_to[comment_to])
        else:
            return 0

    def get_comments_by_comment_to(self, account, comment_to):
        if comment_to not in self.comment_info_by_comment_to:
            return []

        output = []
        for comment_info in \
                self.comment_info_by_comment_to[comment_to].values():

            if comment_info['is_submit']:
                output.append({
                    'comment_from': comment_info['comment_from'],
                    'submission_time': comment_info['time'],
                    'content': comment_info['content'],
                    'is_viewed': account in comment_info['viewed'],
                    'has_submitted': True
                })
        return output

    def get_comments_by_comment_from(self, comment_from):
        if comment_from not in self.comment_info_by_comment_from:
            return []

        output = []
        for comment in \
                self.comment_info_by_comment_from[comment_from].values():

            output.append({
                'comment_to': comment['comment_to'],
                'submission_time': comment['time'],
                'content': comment['content'],
                'is_viewed': comment_from in comment['viewed'],
                'has_submitted': comment['is_submit']
            })
        return output

    def get_review_content(self, account_name, comment_from, comment_to):
        comment = self.comment_info_by_comment_to[comment_to][comment_from]

        if account_name not in comment['viewed']:
            comment['viewed'].append(account_name)

        return comment['content']
