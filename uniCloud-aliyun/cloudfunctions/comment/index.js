"use strict";

const db = uniCloud.database();
const dbCmd = db.command;
const $ = db.command.aggregate;

exports.main = async (event, context) => {
  const { action, data } = event;

  switch (action) {
    case "create":
      return await createComment(data);
    case "getList":
      return await getCommentList(data);
    case "like":
      return await likeComment(data);
    case "delete":
      return await deleteComment(data);
    default:
      return {
        code: 404,
        msg: "未找到对应的方法",
      };
  }
};

// 创建评论
async function createComment(data) {
  const { post_id, user_id, content, reply_to } = data;

  const transaction = await db.startTransaction();

  try {
    // 创建评论
    const comment = await transaction.collection("comments").add({
      post_id,
      user_id,
      content,
      reply_to,
      likeCount: 0,
      create_date: new Date(),
    });

    // 更新帖子评论数
    await transaction
      .collection("posts")
      .doc(post_id)
      .update({
        commentCount: dbCmd.inc(1),
      });

    await transaction.commit();

    return {
      code: 0,
      msg: "评论成功",
      data: comment,
    };
  } catch (e) {
    await transaction.rollback();
    return {
      code: -1,
      msg: "评论失败",
      error: e,
    };
  }
}

// 获取评论列表
async function getCommentList(data) {
  const { post_id, uid } = data;

  try {
    const list = await db
      .collection("comments")
      .aggregate()
      .match({
        post_id,
        reply_to: null, // 只获取一级评论
      })
      .lookup({
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      })
      .unwind("$user")
      .lookup({
        from: "comments",
        let: {
          comment_id: "$_id",
        },
        pipeline: $.pipeline()
          .match(dbCmd.expr($.eq(["$reply_to", "$$comment_id"])))
          .lookup({
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          })
          .unwind("$user")
          .project({
            _id: 1,
            content: 1,
            create_date: 1,
            "user._id": 1,
            "user.nickname": 1,
            "user.avatar": 1,
          })
          .done(),
        as: "replies",
      })
      .lookup({
        from: "likes",
        let: {
          comment_id: "$_id",
        },
        pipeline: $.pipeline()
          .match(
            dbCmd.expr(
              $.and([
                $.eq(["$user_id", uid]),
                $.eq(["$comment_id", "$$comment_id"]),
                $.eq(["$type", "like"]),
              ])
            )
          )
          .done(),
        as: "like",
      })
      .project({
        _id: 1,
        content: 1,
        likeCount: 1,
        create_date: 1,
        "user._id": 1,
        "user.nickname": 1,
        "user.avatar": 1,
        replies: 1,
        isLiked: $.gt([$.size("$like"), 0]),
      })
      .sort({
        create_date: -1,
      })
      .end();

    return {
      code: 0,
      msg: "获取成功",
      data: list.data,
    };
  } catch (e) {
    return {
      code: -1,
      msg: "获取失败",
      error: e,
    };
  }
}

// 点赞评论
async function likeComment(data) {
  const { comment_id, user_id } = data;

  const transaction = await db.startTransaction();

  try {
    const like = await transaction
      .collection("likes")
      .where({
        comment_id,
        user_id,
        type: "like",
      })
      .get();

    if (like.data.length > 0) {
      // 取消点赞
      await transaction.collection("likes").doc(like.data[0]._id).remove();

      await transaction
        .collection("comments")
        .doc(comment_id)
        .update({
          likeCount: dbCmd.inc(-1),
        });

      await transaction.commit();

      return {
        code: 0,
        msg: "取消点赞成功",
        data: {
          isLiked: false,
        },
      };
    } else {
      // 添加点赞
      await transaction.collection("likes").add({
        comment_id,
        user_id,
        type: "like",
        create_date: new Date(),
      });

      await transaction
        .collection("comments")
        .doc(comment_id)
        .update({
          likeCount: dbCmd.inc(1),
        });

      await transaction.commit();

      return {
        code: 0,
        msg: "点赞成功",
        data: {
          isLiked: true,
        },
      };
    }
  } catch (e) {
    await transaction.rollback();
    return {
      code: -1,
      msg: "操作失败",
      error: e,
    };
  }
}

// 删除评论
async function deleteComment(data) {
  const { comment_id, post_id } = data;

  const transaction = await db.startTransaction();

  try {
    // 删除评论
    await transaction.collection("comments").doc(comment_id).remove();

    // 删除回复
    await transaction
      .collection("comments")
      .where({
        reply_to: comment_id,
      })
      .remove();

    // 删除相关的点赞
    await transaction
      .collection("likes")
      .where({
        comment_id,
      })
      .remove();

    // 更新帖子评论数
    await transaction
      .collection("posts")
      .doc(post_id)
      .update({
        commentCount: dbCmd.inc(-1),
      });

    await transaction.commit();

    return {
      code: 0,
      msg: "删除成功",
    };
  } catch (e) {
    await transaction.rollback();
    return {
      code: -1,
      msg: "删除失败",
      error: e,
    };
  }
}
