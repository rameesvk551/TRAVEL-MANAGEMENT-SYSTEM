import React from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Typography,
    Space,
    Tag,
    List,
    Avatar,
    Spin,
    Empty,
    Progress,
    Tooltip,
} from 'antd';
import {
    FireOutlined,
    ShoppingCartOutlined,
    EyeOutlined,
    StarOutlined,
    TrophyOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { recommendationApi } from '../../../api/modules';
import type { RecommendedProduct, RecommendationResult } from '../../../api/modules';

const { Text } = Typography;

interface RecommendationWidgetProps {
    leadId?: string;
    productId?: string;
    showTrending?: boolean;
    showPopular?: boolean;
    limit?: number;
}

// Strategy icons for future use
// const strategyIcons: Record<string, React.ReactNode> = {
//     interest_based: <StarOutlined />,
//     budget_based: <span>💰</span>,
//     popularity: <TrophyOutlined />,
// };

const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
    leadId,
    productId,
    showTrending = true,
    showPopular = true,
    limit = 5,
}) => {
    // For future strategy selection feature
    // const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

    // Personalized recommendations for lead
    const { data: personalizedData, isLoading: personalizedLoading } = useQuery({
        queryKey: ['recommendations-personalized', leadId],
        queryFn: () => recommendationApi.getPersonalized(leadId!, { limit }),
        enabled: !!leadId,
    });

    // Similar products
    const { data: similarData, isLoading: similarLoading } = useQuery({
        queryKey: ['recommendations-similar', productId],
        queryFn: () => recommendationApi.getSimilar(productId!, limit),
        enabled: !!productId,
    });

    // Trending products
    const { data: trendingData, isLoading: trendingLoading } = useQuery({
        queryKey: ['recommendations-trending'],
        queryFn: () => recommendationApi.getTrending({ limit }),
        enabled: showTrending,
    });

    // Popular products - used for showPopular feature
    useQuery({
        queryKey: ['recommendations-popular'],
        queryFn: () => recommendationApi.getPopular({ limit }),
        enabled: showPopular,
    });

    const renderRecommendationList = (
        result: RecommendationResult | undefined,
        loading: boolean,
        title: string,
        icon: React.ReactNode
    ) => {
        if (loading) return <Spin size="small" />;
        if (!result?.products?.length) return null;

        return (
            <Card
                size="small"
                title={
                    <Space>
                        {icon}
                        <span>{title}</span>
                        <Tag color="blue">{result.strategy}</Tag>
                    </Space>
                }
                extra={
                    <Tooltip title={`Confidence: ${(result.confidence * 100).toFixed(0)}%`}>
                        <Progress
                            type="circle"
                            percent={Math.round(result.confidence * 100)}
                            width={30}
                            strokeWidth={10}
                        />
                    </Tooltip>
                }
                style={{ marginBottom: 16 }}
            >
                <List
                    size="small"
                    dataSource={result.products}
                    renderItem={(item: RecommendedProduct) => (
                        <List.Item
                            actions={[
                                <Text strong style={{ color: '#52c41a' }}>
                                    ₹{item.product?.price?.toFixed(2)}
                                </Text>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    item.product?.imageUrl ? (
                                        <Avatar src={item.product.imageUrl} shape="square" size={48} />
                                    ) : (
                                        <Avatar shape="square" size={48} style={{ backgroundColor: '#f0f0f0' }}>
                                            {item.product?.name?.charAt(0)}
                                        </Avatar>
                                    )
                                }
                                title={
                                    <Space>
                                        <Text strong ellipsis style={{ maxWidth: 200 }}>
                                            {item.product?.name}
                                        </Text>
                                        <Progress
                                            percent={Math.round(item.score * 100)}
                                            size="small"
                                            style={{ width: 60 }}
                                            showInfo={false}
                                        />
                                    </Space>
                                }
                                description={
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {item.reason}
                                        </Text>
                                        <div style={{ marginTop: 4 }}>
                                            {item.matchFactors?.slice(0, 3).map((factor) => (
                                                <Tag key={factor} color="default" style={{ fontSize: 10 }}>
                                                    {factor}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        );
    };

    return (
        <div>
            {/* Personalized Recommendations */}
            {leadId && renderRecommendationList(
                personalizedData?.data,
                personalizedLoading,
                'Recommended for You',
                <StarOutlined style={{ color: '#faad14' }} />
            )}

            {/* Similar Products */}
            {productId && renderRecommendationList(
                similarData?.data,
                similarLoading,
                'Similar Products',
                <span>🔍</span>
            )}

            {/* Trending */}
            {showTrending && renderRecommendationList(
                trendingData?.data,
                trendingLoading,
                'Trending Now',
                <FireOutlined style={{ color: '#ff4d4f' }} />
            )}
        </div>
    );
};

// Analytics Dashboard Component
const RecommendationAnalytics: React.FC = () => {
    const { data: popularData, isLoading } = useQuery({
        queryKey: ['recommendations-popular-analytics'],
        queryFn: () => recommendationApi.getPopular({ limit: 10 }),
    });

    const popularProducts = popularData?.data || [];

    return (
        <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Products Tracked"
                            value={popularProducts.length}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Total Views"
                            value={popularProducts.reduce((sum: number, p: any) => sum + (p.views || 0), 0)}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Cart Adds"
                            value={popularProducts.reduce((sum: number, p: any) => sum + (p.cartAdds || 0), 0)}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic
                            title="Purchases"
                            value={popularProducts.reduce((sum: number, p: any) => sum + (p.purchases || 0), 0)}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title={<><TrophyOutlined /> Top Products by Engagement</>}>
                {isLoading ? (
                    <Spin />
                ) : popularProducts.length === 0 ? (
                    <Empty description="No product analytics yet" />
                ) : (
                    <List
                        dataSource={popularProducts}
                        renderItem={(item: any, index: number) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Avatar style={{ backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }}>
                                            {index + 1}
                                        </Avatar>
                                    }
                                    title={item.productId}
                                    description={
                                        <Space split="|">
                                            <span><EyeOutlined /> {item.views} views</span>
                                            <span><ShoppingCartOutlined /> {item.cartAdds} carts</span>
                                            <span>✅ {item.purchases} sales</span>
                                        </Space>
                                    }
                                />
                                <Progress
                                    percent={Math.round((item.score / (popularProducts[0]?.score || 1)) * 100)}
                                    size="small"
                                    style={{ width: 100 }}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Card>
        </div>
    );
};

export { RecommendationWidget, RecommendationAnalytics };
export default RecommendationWidget;
